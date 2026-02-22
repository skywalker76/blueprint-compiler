## .context/style-guide.md (~350 lines)

```markdown
# WordPresFromCli Style Guide

## TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "checkJs": false
  }
}
```

## File Naming Conventions
- **Commands**: `kebab-case.command.ts` → `create-site.command.ts`
- **Services**: `PascalCase.service.ts` → `WordPressService.ts`
- **Types**: `PascalCase.types.ts` → `SiteConfiguration.types.ts`
- **Utils**: `camelCase.util.ts` → `validateDomain.util.ts`
- **Config**: `kebab-case.config.ts` → `wordpress-defaults.config.ts`
- **Tests**: `[filename].test.ts` → `create-site.command.test.ts`

## Directory Structure
```
src/
├── commands/           # CLI command implementations
├── services/           # Business logic & external integrations
├── types/             # TypeScript interfaces & types
├── utils/             # Pure utility functions
├── config/            # Configuration constants
├── middleware/        # Command middleware (auth, validation)
└── templates/         # WordPress configuration templates
```

## Import Order
1. Node.js built-ins
2. External dependencies
3. Internal aliases (`@/...`)
4. Relative imports (`./...`)
5. Type imports last

```typescript
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { validateDomain } from '@/utils/validateDomain.util';
import { LOCAL_CONFIG } from './config';
import type { SiteConfiguration } from '@/types/SiteConfiguration.types';
```

## Variable Naming
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions**: `camelCase` verbs → `createSite()`, `validateInput()`
- **Classes**: `PascalCase` nouns → `SiteManager`, `DomainValidator`
- **Interfaces**: `I` prefix → `ISiteConfiguration`, `IWordPressOptions`
- **Types**: No prefix → `SiteStatus`, `DeploymentResult`
- **Enums**: `PascalCase` → `SiteStatus { Active, Suspended, Deleted }`
- **Private fields**: `_` prefix → `private _apiKey: string`

## Function Patterns
```typescript
// Command handler pattern
export async function createSiteCommand(
  args: CreateSiteArgs,
  options: CommandOptions
): Promise<CommandResult> {
  // 1. Validate
  const validation = validateCreateSiteInput(args);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  // 2. Execute
  try {
    const site = await siteService.create(validation.data);
    return { success: true, data: site };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
}

// Service method pattern
class WordPressService {
  async createSite(config: ISiteConfiguration): Promise<Site> {
    // Pre-conditions
    assert(config.domain, 'Domain is required');
    assert(config.corporateId, 'Corporate ID is required');

    // Business logic
    const site = await this._provisionInfrastructure(config);
    await this._installWordPress(site);
    await this._configureSite(site, config);

    // Post-conditions
    assert(site.status === SiteStatus.Active, 'Site must be active');
    return site;
  }
}
```

## Error Handling
```typescript
// Custom error classes
export class WordPressError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'WordPressError';
  }
}

export class ValidationError extends WordPressError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// Error usage
throw new ValidationError('Invalid domain format', 'domain');
```

## Async Patterns
```typescript
// Concurrent operations with proper error handling
async function deploySites(siteIds: string[]): Promise<DeploymentResult[]> {
  const results = await Promise.allSettled(
    siteIds.map(id => deploymentService.deploy(id))
  );

  return results.map((result, index) => ({
    siteId: siteIds[index],
    success: result.status === 'fulfilled',
    error: result.status === 'rejected' ? result.reason.message : undefined
  }));
}

// Retry pattern
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}
```

## Command Line Interface
```typescript
// Command structure
export const createSiteCommand = new Command('create')
  .description('Create a new WordPress site')
  .argument('<domain>', 'Site domain (e.g., acme.company.com)')
  .option('-c, --corporate-id <id>', 'Corporate account ID', process.env.CORPORATE_ID)
  .option('-t, --template <name>', 'WordPress template', 'corporate-default')
  .option('--dry-run', 'Simulate without creating resources')
  .action(async (domain: string, options: CreateOptions) => {
    // Implementation
  });

// Output formatting
console.log(chalk.green('✓'), 'Site created successfully');
console.error(chalk.red('✗'), 'Failed to create site:', error.message);
```

## Supabase Patterns
```typescript
// Client initialization (singleton)
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }
  return supabaseClient;
}

// Repository pattern
export class SiteRepository {
  private client = getSupabaseClient();

  async create(site: Omit<Site, 'id' | 'createdAt'>): Promise<Site> {
    const { data, error } = await this.client
      .from('sites')
      .insert(site)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return data;
  }

  async findByCorporateId(corporateId: string): Promise<Site[]> {
    const { data, error } = await this.client
      .from('sites')
      .select('*')
      .eq('corporate_id', corporateId)
      .order('created_at', { ascending: false });

    if (error) throw new DatabaseError(error.message);
    return data;
  }
}
```

## Type Guards
```typescript
export function isSiteConfiguration(obj: unknown): obj is ISiteConfiguration {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'domain' in obj &&
    'corporateId' in obj &&
    typeof (obj as any).domain === 'string' &&
    typeof (obj as any).corporateId === 'string'
  );
}

// Usage
if (!isSiteConfiguration(config)) {
  throw new ValidationError('Invalid site configuration');
}
```

## Comments & Documentation
```typescript
/**
 * Creates a new WordPress site for a corporate account.
 * 
 * @param config - Site configuration including domain and corporate ID
 * @returns Promise resolving to the created site entity
 * @throws {ValidationError} If domain format is invalid
 * @throws {ConflictError} If domain already exists
 * @throws {QuotaError} If corporate account exceeds site limit
 */
export async function createSite(config: ISiteConfiguration): Promise<Site> {
  // Implementation comments only for complex logic
  // Example: Binary search optimization for large domain lists
}
```

## Environment Variables
```typescript
// Required environment variables (validate at startup)
export const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'WORDPRESS_API_KEY',
  'HOSTING_PROVIDER_API_KEY'
] as const;

// Typed environment access
export const env = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!
  },
  wordpress: {
    apiKey: process.env.WORDPRESS_API_KEY!,
    defaultVersion: process.env.WORDPRESS_VERSION || '6.4'
  }
} as const;
```

## Logging
```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  }
});

// Structured logging
logger.info({ siteId, domain }, 'Creating WordPress site');
logger.error({ error, siteId }, 'Failed to provision site');
```

## Security Patterns
```typescript
// Input sanitization
export function sanitizeDomain(domain: string): string {
  return domain.toLowerCase().trim().replace(/[^a-z0-9.-]/g, '');
}

// API key validation
export function validateApiKey(key: string): void {
  if (!key || !API_KEY_REGEX.test(key)) {
    throw new AuthenticationError('Invalid API key format');
  }
}

// Rate limiting
const rateLimiter = new Map<string, number[]>();

export function checkRateLimit(corporateId: string, limit: number = 10): void {
  const now = Date.now();
  const window = 60000; // 1 minute
  const requests = rateLimiter.get(corporateId) || [];
  
  const recentRequests = requests.filter(time => now - time < window);
  
  if (recentRequests.length >= limit) {
    throw new RateLimitError(`Rate limit exceeded: ${limit} requests per minute`);
  }
  
  recentRequests.push(now);
  rateLimiter.set(corporateId, recentRequests);
}
```
```

## .context/adr/001-supabase-backend.md (~80 lines)

```markdown
# ADR-001: Supabase as Backend Infrastructure

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team

## Context
WordPresFromCli requires a scalable backend to manage corporate WordPress site deployments, user authentication, and configuration storage.

## Decision
Use Supabase as the primary backend infrastructure.

## Consequences

### Positive
- **Instant PostgreSQL**: Production-ready database without manual setup
- **Built-in Auth**: Corporate SSO support via OAuth providers
- **Row Level Security**: Native tenant isolation for multi-corporate setup
- **Realtime**: Site status updates without polling
- **Auto-generated APIs**: REST and GraphQL without custom code
- **Edge Functions**: Serverless WordPress provisioning logic

### Negative
- **Vendor Lock-in**: PostgreSQL-specific features reduce portability
- **Cold Starts**: Edge functions have 100-300ms initialization penalty
- **Regional Limitations**: Must choose primary region upfront

## Implementation

### Database Schema
```sql
-- Corporate accounts
CREATE TABLE corporates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'enterprise')),
  site_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WordPress sites
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID REFERENCES corporates(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioning',
  wordpress_version TEXT NOT NULL DEFAULT '6.4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_deployed TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Corporate isolation policy
CREATE POLICY "Corporate site isolation" ON sites
  FOR ALL USING (auth.jwt() ->> 'corporate_id' = corporate_id::TEXT);
```

### Edge Function Pattern
```typescript
// supabase/functions/provision-site/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { siteId } = await req.json();
  
  // Provision WordPress infrastructure
  // Update site status in database
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Security Configuration
- Enable RLS on all tables
- Use service_role key only in Edge Functions
- Implement JWT corporate_id claims
- Rotate anon/service keys quarterly
```

## .context/adr/002-cli-architecture.md (~70 lines)

```markdown
# ADR-002: CLI Architecture Pattern

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team

## Context
WordPresFromCli needs a robust command-line interface that supports complex workflows, authentication, and extensibility.

## Decision
Implement Commander.js-based architecture with middleware pattern.

## Consequences

### Positive
- **Familiar Pattern**: Standard CLI structure developers expect
- **Middleware Support**: Cross-cutting concerns (auth, logging) in one place
- **Auto-help Generation**: Built-in --help for all commands
- **Subcommand Nesting**: Natural `wp site create` hierarchy
- **TypeScript Support**: Full type safety for command handlers

### Negative
- **Bundle Size**: Commander adds ~50KB to binary
- **Testing Complexity**: Command parsing requires integration tests
- **Global State**: Middleware pattern encourages singleton services

## Implementation

### Command Structure
```
wp
├── auth
│   ├── login
│   └── logout
├── site
│   ├── create
│   ├── list
│   ├── delete
│   └── deploy
├── config
│   ├── set
│   └── get
└── corporate
    ├── switch
    └── info
```

### Middleware Pipeline
```typescript
// src/middleware/auth.middleware.ts
export async function requireAuth(next: () => Promise<void>): Promise<void> {
  const token = await tokenService.getValid();
  if (!token) {
    console.error(chalk.red('Authentication required. Run: wp auth login'));
    process.exit(1);
  }
  await next();
}

// src/middleware/corporate.middleware.ts
export async function requireCorporateContext(next: () => Promise<void>): Promise<void> {
  const corporateId = await configService.get('corporate_id');
  if (!corporateId) {
    console.error(chalk.red('No corporate account selected. Run: wp corporate switch'));
    process.exit(1);
  }
  await next();
}
```

### Command Registration
```typescript
// src/commands/site/create.command.ts
export function registerCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Create a new WordPress site')
    .argument('<domain>', 'Site domain')
    .option('-t, --template <name>', 'Template name', 'corporate-default')
    .middleware(requireAuth)
    .middleware(requireCorporateContext)
    .action(createSiteHandler);
}
```

### Error Handling Strategy
- Catch all exceptions at command boundary
- Format errors based on --verbose flag
- Exit codes: 0=success, 1=user error, 2=system error
- Log full stack traces to ~/.wp-cli/logs/
```

## .context/adr/003-wordpress-provisioning.md (~60 lines)

```markdown
# ADR-003: WordPress Site Provisioning Strategy

**Status**: Accepted  
**Date**: 2024-01-15  
**Deciders**: Architecture Team

## Context
Need to provision WordPress sites on-demand with corporate-specific configurations, plugins, and themes.

## Decision
Use containerized WordPress with configuration-as-code approach.

## Consequences

### Positive
- **Reproducible Builds**: Docker ensures identical environments
- **Version Control**: WordPress config stored in Git
- **Instant Rollback**: Container tags enable quick reverts
- **Plugin Management**: Composer for dependency management
- **Scalability**: Horizontal scaling via container orchestration

### Negative
- **Container Overhead**: ~200MB per site base image
- **Database Separation**: Requires external MySQL/PostgreSQL
- **File Persistence**: Must handle uploads/media separately

## Implementation

### WordPress Image Structure
```dockerfile
FROM wordpress:6.4-php8.2-apache

# Install corporate plugins via Composer
COPY composer.json /var/www/html/
RUN composer install --no-dev --optimize-autoloader

# Apply corporate theme
COPY themes/corporate-theme /var/www/html/wp-content/themes/corporate-theme

# Security hardening
RUN echo "define('DISALLOW_FILE_EDIT', true);" >> wp-config.php && \
    echo "define('WP_AUTO_UPDATE_CORE', 'minor');" >> wp-config.php
```

### Configuration Templates
```yaml
# templates/corporate-default.yaml
wordpress:
  version: "6.4"
  language: "en_US"
  timezone: "America/New_York"
  
plugins:
  required:
    - akismet: "^5.0"
    - wordfence: "^7.0"
    - wp-mail-smtp: "^3.0"
  optional:
    - contact-form-7: "^5.0"
    - yoast-seo: "^21.0"

theme:
  name: "corporate-theme"
  settings:
    primary_color: "#003366"
    logo_url: "https://corporate.com/logo.png"

security:
  force_ssl: true
  limit_login_attempts: 5
  two_factor_auth: "encouraged"
```

### Provisioning Workflow
1. Parse template YAML
2. Build Docker image with plugins/theme
3. Push to container registry
4. Create database schema
5. Deploy container with environment config
6. Run WordPress installation
7. Apply corporate settings via WP-CLI
8. Enable monitoring/backups
```