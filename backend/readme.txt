# AI Gateway Backend

Organization-based API gateway with Keycloak authentication, token quotas, and usage tracking.

## Architecture

```
OpenRouter API Key (Parent)
    └── Organization
            ├── Organization API Key (full access)
            ├── Admin API Key (manage users/quotas)
            └── User API Keys (limited access per user)
```

## Features

- **Organization Management**: Create orgs with parent OpenRouter API key
- **Hierarchical API Keys**: Organization → Admin → User keys
- **Token Quotas**: Daily/monthly limits per API key
- **Model Restrictions**: Control which models each key can access
- **Usage Tracking**: Full logging of all API requests
- **Keycloak Integration**: User management via Keycloak RBAC

## API Endpoints

### Authentication
- `POST /auth/login` - Login with Keycloak credentials
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens

### Organizations (Admin only)
- `GET /organizations/` - List all organizations
- `POST /organizations/` - Create organization with OpenRouter key
- `GET /organizations/{id}` - Get organization details
- `PUT /organizations/{id}` - Update organization
- `DELETE /organizations/{id}` - Delete organization
- `GET /organizations/{id}/models` - List allowed models
- `POST /organizations/{id}/models` - Add allowed model
- `DELETE /organizations/{id}/models/{model_id}` - Remove model

### API Keys (Admin only)
- `GET /api-keys/` - List all API keys
- `POST /api-keys/` - Create new API key
- `GET /api-keys/my-keys` - Get current user's keys
- `GET /api-keys/{id}` - Get key details
- `PUT /api-keys/{id}` - Update key settings
- `DELETE /api-keys/{id}` - Delete key
- `POST /api-keys/{id}/regenerate` - Regenerate key
- `GET /api-keys/{id}/usage` - Get usage logs
- `GET /api-keys/{id}/usage/summary` - Get usage summary

### User Management (Admin only)
- `GET /admin/users/` - List all Keycloak users
- `POST /admin/users/` - Create user
- `GET /admin/users/{id}` - Get user details
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user
- `PUT /admin/users/{id}/status` - Enable/disable user
- `POST /admin/users/{id}/roles/{role}` - Assign role
- `DELETE /admin/users/{id}/roles/{role}` - Remove role
- `POST /admin/users/{id}/groups/{group}` - Add to group
- `DELETE /admin/users/{id}/groups/{group}` - Remove from group

### Quota Management (Admin only)
- `GET /admin/quotas/` - List all quotas
- `GET /admin/quotas/{key_id}` - Get quota details
- `PUT /admin/quotas/{key_id}` - Update quota
- `POST /admin/quotas/{key_id}/reset-daily` - Reset daily usage
- `POST /admin/quotas/{key_id}/reset-monthly` - Reset monthly usage

### AI Proxy (Uses generated API keys)
- `POST /v1/chat/completions` - Proxy to OpenRouter (OpenAI-compatible)
- `GET /v1/models` - List available models
- `GET /v1/usage` - Get current usage stats

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:pass@localhost/dbname"
export KEYCLOAK_URL="http://localhost:8080"
export KEYCLOAK_REALM="your-realm"
export KEYCLOAK_CLIENT_ID="your-client"
export KEYCLOAK_CLIENT_SECRET="your-secret"
```

3. Run the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Usage Example

### 1. Create Organization (Admin)
```bash
curl -X POST http://localhost:8000/organizations/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Science Team",
    "openrouter_api_key": "sk-or-..."
  }'
```

### 2. Add Allowed Models
```bash
curl -X POST http://localhost:8000/organizations/1/models \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"model_id": "openai/gpt-4o-mini"}'
```

### 3. Create User API Key
```bash
curl -X POST http://localhost:8000/api-keys/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": 1,
    "keycloak_user_id": "user-uuid",
    "key_type": "user",
    "name": "John User Key",
    "daily_token_limit": 100000,
    "monthly_token_limit": 1000000,
    "allowed_models": ["openai/gpt-4o-mini"]
  }'
```

### 4. Use API Key for AI Requests
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer sk-org-user-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Database Schema

- **organizations**: Parent entities with OpenRouter keys
- **api_keys**: Generated keys (org/admin/user types)
- **allowed_models**: Models allowed per organization
- **api_key_model_restrictions**: Per-key model restrictions
- **usage_logs**: Request/token usage tracking
