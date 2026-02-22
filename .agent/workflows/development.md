```markdown
# .agent/workflows/WORDPRESS_MANAGEMENT.md

## 1. Create New WordPress Site

### Triggers
- Command: `wp-create-site --domain=example.com --company="Corp Name"`
- Complexity: 4 (requires plan)

### Pre-flight Checks
1. Verify domain DNS points to server IP
2. Confirm SSL certificate available via Let's Encrypt
3. Check disk space > 2GB free
4. Validate unique site identifier in Supabase

### Execution Steps
1. **Database Setup**
   ```bash
   wp db create wp_${SITE_ID}
   wp config create --dbname=wp_${SITE_ID} --dbuser=$DB_USER --dbpass=$DB_PASS
   ```
   
2. **Core Installation**
   ```bash
   wp core download --path=/var/www/${DOMAIN}
   wp core install --url=https://${DOMAIN} --title="${COMPANY}" --admin_user=admin --admin_email=${ADMIN_EMAIL}
   ```

3. **Security Hardening**
   ```bash
   wp config set WP_DEBUG false --raw
   wp config set DISALLOW_FILE_EDIT true --raw
   wp plugin install wordfence --activate
   wp salt regenerate
   ```

4. **Supabase Registration**
   ```sql
   INSERT INTO wordpress_sites (domain, company, wp_path, created_at, admin_email)
   VALUES ($1, $2, $3, NOW(), $4)
   RETURNING site_id;
   ```

5. **Nginx Configuration**
   ```nginx
   server {
       server_name ${DOMAIN};
       root /var/www/${DOMAIN};
       include /etc/nginx/wordpress.conf;
   }
   ```

6. **SSL Setup**
   ```bash
   certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos
   ```

### Verification
- [ ] Site responds 200 on HTTPS
- [ ] Admin login successful
- [ ] Supabase entry contains site_id
- [ ] SSL grade A+ on SSLLabs

### Rollback
```bash
wp db drop wp_${SITE_ID} --yes
rm -rf /var/www/${DOMAIN}
DELETE FROM wordpress_sites WHERE domain = ${DOMAIN};
rm /etc/nginx/sites-enabled/${DOMAIN}.conf
```

---

## 2. Bulk Update WordPress Sites

### Triggers
- Command: `wp-bulk-update --action=[plugin-update|theme-update|core-update]`
- Cron: Daily 3 AM UTC
- Complexity: 3

### Pre-flight Checks
1. Create full backup of all sites
2. Verify staging environment sync
3. Check update compatibility matrix

### Execution Steps
1. **Fetch Site List**
   ```sql
   SELECT site_id, domain, wp_path FROM wordpress_sites 
   WHERE status = 'active' AND maintenance_window @> NOW()::time;
   ```

2. **Staging Test**
   ```bash
   for site in ${SITES[@]}; do
     wp core update --path=${site.wp_path} --dry-run
     wp plugin update --all --path=${site.wp_path} --dry-run
   done
   ```

3. **Production Updates**
   ```bash
   for site in ${SITES[@]}; do
     wp maintenance-mode activate --path=${site.wp_path}
     wp core update --path=${site.wp_path}
     wp plugin update --all --exclude=wordfence --path=${site.wp_path}
     wp theme update --all --path=${site.wp_path}
     wp cache flush --path=${site.wp_path}
     wp maintenance-mode deactivate --path=${site.wp_path}
   done
   ```

4. **Health Checks**
   ```bash
   parallel -j 10 'curl -sI https://{} | grep "200 OK"' ::: ${DOMAINS[@]}
   ```

5. **Update Registry**
   ```sql
   UPDATE wordpress_sites 
   SET last_updated = NOW(), 
       wp_version = (SELECT version FROM wp_version_check)
   WHERE site_id = ANY($1::int[]);
   ```

### Verification
- [ ] All sites return 200 status
- [ ] No PHP errors in logs
- [ ] Update timestamps in Supabase
- [ ] Plugin compatibility report clean

### Rollback
```bash
for site in ${FAILED_SITES[@]}; do
  wp db import ${site}_backup.sql --path=${site.wp_path}
  rsync -av /backup/${site}/ /var/www/${site}/
done
```

---

## 3. Corporate Migration Pipeline

### Triggers
- Command: `wp-migrate --source=old.example.com --target=new.example.com`
- Complexity: 5 (always requires plan)

### Pre-flight Checks
1. Source site accessibility verification
2. Target infrastructure provisioned
3. DNS TTL reduced to 300s (5 min)
4. Migration window approved by corporate

### Execution Steps
1. **Content Export**
   ```bash
   wp export --path=/var/www/${SOURCE} --dir=/tmp/migration/${TICKET_ID}/
   wp db export /tmp/migration/${TICKET_ID}/database.sql --path=/var/www/${SOURCE}
   ```

2. **Asset Sync**
   ```bash
   rsync -avz /var/www/${SOURCE}/wp-content/uploads/ /var/www/${TARGET}/wp-content/uploads/
   rsync -avz /var/www/${SOURCE}/wp-content/themes/ /var/www/${TARGET}/wp-content/themes/
   ```

3. **Database Migration**
   ```bash
   wp db import /tmp/migration/${TICKET_ID}/database.sql --path=/var/www/${TARGET}
   wp search-replace ${SOURCE} ${TARGET} --all-tables --path=/var/www/${TARGET}
   ```

4. **URL Rewriting**
   ```sql
   UPDATE wp_options SET option_value = REPLACE(option_value, '${SOURCE}', '${TARGET}')
   WHERE option_name IN ('siteurl', 'home');
   ```

5. **Plugin State Transfer**
   ```bash
   wp option get active_plugins --path=/var/www/${SOURCE} --format=json > /tmp/plugins.json
   wp option update active_plugins --format=json --path=/var/www/${TARGET} < /tmp/plugins.json
   ```

6. **DNS Cutover**
   ```bash
   # Update Route53/Cloudflare via API
   dns-update --domain=${TARGET} --type=A --value=${NEW_IP}
   ```

### Verification
- [ ] All pages render without 404s
- [ ] Media assets load correctly
- [ ] Forms submit to correct endpoints
- [ ] SSL certificate valid for new domain
- [ ] Supabase migration_log entry complete

### Rollback
```bash
dns-update --domain=${TARGET} --type=A --value=${OLD_IP}
wp db import /backup/pre-migration-${SOURCE}.sql --path=/var/www/${SOURCE}
UPDATE wordpress_sites SET migration_status = 'rolled_back' WHERE domain = ${SOURCE};
```

---

## 4. Security Incident Response

### Triggers
- Alert: Wordfence critical notification
- Monitor: Suspicious file changes detected
- Complexity: 5 (immediate action, retrospective plan)

### Immediate Response (<5 min)
1. **Isolate Site**
   ```bash
   iptables -I INPUT -s 0.0.0.0/0 -d ${SITE_IP} -j DROP
   echo "deny all;" > /var/www/${DOMAIN}/.htaccess
   ```

2. **Snapshot State**
   ```bash
   tar -czf /quarantine/${DOMAIN}-${TIMESTAMP}.tar.gz /var/www/${DOMAIN}
   wp db export /quarantine/${DOMAIN}-${TIMESTAMP}.sql --path=/var/www/${DOMAIN}
   ```

3. **Alert Stakeholders**
   ```sql
   INSERT INTO security_incidents (domain, severity, detected_at, response_status)
   VALUES ($1, 'critical', NOW(), 'contained')
   RETURNING incident_id;
   ```

### Investigation Phase
1. **Scan Filesystem**
   ```bash
   wp malware scan --path=/var/www/${DOMAIN} --output=/tmp/scan-${INCIDENT_ID}.json
   find /var/www/${DOMAIN} -type f -name "*.php" -mtime -7 -exec grep -l "eval\|base64\|system" {} \;
   ```

2. **Audit Database**
   ```sql
   SELECT * FROM wp_users WHERE user_registered > NOW() - INTERVAL '7 days';
   SELECT * FROM wp_posts WHERE post_content ~ 'script|iframe|eval';
   ```

3. **Log Analysis**
   ```bash
   grep ${DOMAIN} /var/log/nginx/access.log | awk '$9 ~ /4[0-9]{2}|5[0-9]{2}/' | sort | uniq -c
   ```

### Remediation
1. **Clean Infected Files**
   ```bash
   wp core verify-checksums --path=/var/www/${DOMAIN}
   wp plugin verify-checksums --all --path=/var/www/${DOMAIN}
   rm -f $(cat /tmp/infected-files-${INCIDENT_ID}.txt)
   ```

2. **Reset Credentials**
   ```bash
   wp user update $(wp user list --field=ID) --user_pass=$(openssl rand -base64 32) --path=/var/www/${DOMAIN}
   wp config shuffle-salts --path=/var/www/${DOMAIN}
   ```

3. **Apply Patches**
   ```bash
   wp core update --minor --path=/var/www/${DOMAIN}
   wp plugin update --all --path=/var/www/${DOMAIN}
   ```

### Verification
- [ ] Malware scan returns clean
- [ ] Core/plugin checksums match official
- [ ] No unauthorized admin accounts
- [ ] Access logs show normal patterns

### Post-Incident
```sql
UPDATE security_incidents 
SET resolved_at = NOW(), 
    resolution_notes = $2,
    response_status = 'resolved'
WHERE incident_id = $1;
```
```