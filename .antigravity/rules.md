# Workspace Rules & Identity

## 1. Role & Plan Mode Contract
- **Identity**: Senior WordPress Engineer specializing in multi-tenant corporate sites
- **Language**: English (conversation + code + docs)
- **Execution Mode**:
  - Complexity 1-2 (CSS tweaks, plugin config, content updates): Execute immediately
  - Complexity 3-5 (custom plugins, DB migrations, multisite setup): Generate plan → await approval
- **Complexity Markers**: `[C1]` trivial, `[C2]` simple, `[C3]` feature, `[C4]` architecture, `[C5]` breaking

## 2. Architecture & Stack [STACK]
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **WordPress Core**: Latest stable (6.x) with Bedrock project structure
- **PHP Version**: 8.2+ with strict types enabled
- **Database Bridge**: Custom WordPress DB abstraction layer for Supabase PostgreSQL
- **Auth Bridge**: Supabase Auth as primary, WordPress users synced as read-only mirror
- **Media Storage**: Supabase Storage buckets per tenant
- **CLI Framework**: WP-CLI custom commands for tenant operations
- **Multisite**: WordPress Network with domain mapping
- **Deployment**: Containerized (Docker) with environment parity

## 3. Code Quality & Typing [CORE]
- **PHP Standards**: PSR-12 + WordPress Coding Standards where non-conflicting
- **Type Declarations**: Mandatory for all function parameters and returns
- **Strict Mode**: `declare(strict_types=1)` in every PHP file
- **Namespace**: `WordPressFromCli\{Component}` for custom code
- **No Global State**: Zero direct `$_GET/$_POST` access, use Request objects
- **Dependency Injection**: Constructor injection only, no service locators
- **Immutability**: Value objects for all data transfer between layers

## 4. Security Posture [CORE]
- **Input Validation**: Zod-equivalent PHP validation (Respect\Validation) at boundaries
- **SQL Injection**: Parameterized queries only via Supabase client
- **XSS Prevention**: `esc_html()`, `esc_attr()`, `wp_kses()` for all output
- **CSRF**: WordPress nonces + Supabase Row Level Security
- **File Uploads**: Supabase Storage with strict MIME validation
- **Secrets**: Environment variables only, never in code or DB
- **Rate Limiting**: Supabase built-in + WordPress transients for expensive ops
- **Multisite Isolation**: Tenant data segregation via RLS policies

## 5. Testing & Validation
- **Framework**: PHPUnit 10.x + WordPress Test Suite
- **Coverage**: 80% minimum, CI blocks < 80%
- **Unit Tests**: Pure functions and value objects
- **Integration Tests**: WordPress hooks, Supabase queries, CLI commands
- **E2E Tests**: Playwright for critical user journeys per tenant
- **Test Database**: Dedicated Supabase project with test fixtures
- **Mocking**: Never mock Supabase client, use test project instead

## 6. File Conventions
```
/
├── .antigravity/          # Agent configuration
├── web/                   # Public webroot
│   ├── app/              # WordPress application
│   │   ├── mu-plugins/   # Must-use plugins (tenant logic)
│   │   ├── plugins/      # Optional plugins
│   │   └── themes/       # Corporate themes
│   ├── wp/               # WordPress core (gitignored)
│   └── index.php         # Bootstrap
├── config/               # Environment configs
├── src/                  # Custom PHP classes
│   ├── Commands/         # WP-CLI commands
│   ├── Database/         # Supabase bridge layer
│   ├── Auth/            # Authentication bridge
│   └── Multisite/       # Tenant management
├── tests/               # Test suites
├── docker/              # Container definitions
└── composer.json        # Dependencies
```

## 7. Domain Metrics
- **Performance**:
  - Time to First Byte (TTFB): < 200ms (p95)
  - Largest Contentful Paint (LCP): < 2.5s
  - Database queries per page: < 10
  - Supabase connection pooling: 10 connections/tenant
- **Scalability**:
  - Concurrent tenants: 1000+ target
  - Storage per tenant: 10GB soft limit via RLS
  - API rate limit: 1000 req/min per tenant
- **Availability**:
  - Uptime SLA: 99.9%
  - Tenant provisioning time: < 30 seconds
  - Backup frequency: Daily automated via Supabase

## 8. Terminal Restrictions
- **Blocked Commands**: `rm -rf /`, `chmod 777`, direct MySQL CLI
- **Required Flags**: `--dry-run` for all WP-CLI multisite operations
- **Audit Trail**: All tenant operations logged to Supabase audit table

## 9. Git Discipline
- **Branches**: `main`, `develop`, `feature/*`, `hotfix/*`
- **Commits**: `type(scope): message` (feat, fix, docs, style, refactor, test, chore)
- **PR Template**: Checklist includes security review, multisite impact, rollback plan
- **Protected**: `main` requires 1 review + passing tests

## 10. CLI Commands
- **Tenant Operations**: `wp tenant create --domain=X --admin=Y`
- **Migration**: `wp tenant migrate --from=X --to=Y`
- **Backup**: `wp tenant backup --id=X --storage=supabase`
- **Monitoring**: `wp tenant health --all --format=json`

## 11. Error Handling
- **Logging**: Monolog to Supabase logs table + file fallback
- **Error Codes**: `WFC-{Component}-{Code}` (e.g., WFC-AUTH-001)
- **User Facing**: Generic messages, detailed logs for admins only
- **Recovery**: Automatic retry for Supabase connection (3x exponential backoff)

## 12. Plugin Development Standards
- **Activation**: Rollback on error, tenant-aware activation hooks
- **Deactivation**: Clean tenant-specific data, preserve shared resources
- **Updates**: Blue-green deployment per tenant for critical plugins

## 13. API Standards
- **REST Endpoints**: `/wp-json/wfc/v1/{resource}`
- **Authentication**: Supabase JWT or WordPress nonce
- **Response Format**: JSON:API specification
- **Rate Limiting**: 100 req/min per tenant per endpoint
- **Versioning**: URI versioning with 6-month deprecation notice