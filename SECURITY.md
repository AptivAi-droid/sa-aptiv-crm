# Security Policy — Aptiv Bookkeeping CRM (South Africa Edition)

## Regulatory context

This system handles:
- Personal financial data subject to the **Protection of Personal Information Act (POPIA)**
- AML/KYC data subject to the **Financial Intelligence Centre Act (FICA)**
- Co-operative bank financial records subject to **SARB** and **CBDA** oversight
- Market conduct obligations under the **FSCA**
- IFRS-for-SMEs-aligned accounting records

## Reporting a vulnerability

If you discover a security vulnerability in this repository:

1. **Do not open a public GitHub issue.**
2. Email **nealtitus@aptivconsulting.com** with subject `[SECURITY] SA Aptiv CRM — <summary>`
3. Include: description, reproduction steps, potential impact, and any suggested fix
4. We will acknowledge within **48 hours** and aim to resolve critical issues within **7 days**

## Secret management

| Variable | Location | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | GitHub Secrets / `.env` | Public by design — Supabase anon key uses RLS |
| `VITE_SUPABASE_ANON_KEY` | GitHub Secrets / `.env` | Public by design — RLS enforces access |
| `GATEWAY_API_KEY` | Supabase Vault **only** | Server-side via `payment-gateway-proxy` Edge Function |
| `GATEWAY_API_SECRET` | Supabase Vault **only** | Never in browser bundle |
| `BRIDGE_API_KEY` | Supabase Vault **only** | Never in browser bundle |

**Rule:** Any variable prefixed `VITE_` is bundled into client-side JavaScript and visible to anyone who inspects the built app. Never put sensitive credentials in `VITE_` variables.

## Architecture security controls

- **Row Level Security (RLS)** on all 14 Supabase tables — `get_user_role()` enforced per operation
- **Immutable audit log** (`ab_audit_log`) — no `DELETE` policy, complies with POPIA
- **FICA auto-flagging** — transactions ≥ R10,000.00 automatically trigger review workflow (FIC Act s28)
- **PEP screening flag** — Politically Exposed Persons require Enhanced Due Diligence
- **Payment gateway proxy Edge Function** — gateway credentials never leave the server
- **Phone format validation** — `27XXXXXXXXX` enforced at DB level (`CHECK` constraint)
- **SA ID number validation** — 13-digit Luhn checksum enforced at DB level and client-side
- **Journal double-entry constraint** — debit = credit enforced by DB trigger on `Posted` entries
- **Content Security Policy** — see `netlify.toml` for full CSP header

## Dependency updates

Run `npm audit` before each production deploy. Critical vulnerabilities must be resolved before deployment.

## Access control model

| Role | Read | Write Members/Tx | Manage Compliance | Admin |
|---|---|---|---|---|
| Admin | ✓ | ✓ | ✓ | ✓ |
| COO | ✓ | ✓ | ✓ | — |
| Compliance Officer | ✓ | — | ✓ | — |
| Viewer | ✓ | — | — | — |
