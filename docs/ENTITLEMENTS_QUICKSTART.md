# Entitlements Quickstart

This guide helps you set up the OS Kernel (identity + entitlements) and use the API to issue, verify, resolve, and revoke entitlements.

## 1) Run OS Kernel Migration

Ensure `DATABASE_URL` is set in your environment (Railway/Supabase Postgres). Then run the OS Kernel migration. You can do this either from the dev shell or the in-app Terminal (Admin only).

- Dev shell:
  - `npx ts-node script/run-os-migration.ts`
- In-app Terminal:
  - Command: `migrate-os` (now available in the command dropdown)

This creates tables:
- `aethex_subjects`, `aethex_subject_identities`
- `aethex_issuers`, `aethex_issuer_keys`
- `aethex_entitlements`, `aethex_entitlement_events`
- `aethex_audit_log`

## 2) Create an Issuer

Insert an issuer record with a `public_key` and optional metadata. You can use SQL or your DB console (Supabase) for now.

Example SQL:

```sql
INSERT INTO public.aethex_issuers (name, issuer_class, scopes, public_key, is_active)
VALUES ('AeThex Platform', 'platform', '["issue","revoke"]'::json, 'PUBLIC_KEY_STRING', true)
RETURNING id;
```

Save the returned `id` as your `issuer_id`.

## 3) Issue an Entitlement

Endpoint: `POST /api/os/entitlements/issue`

Headers:
- `x-issuer-id: <issuer_id>`

Body:
```json
{
  "subject_id": "<optional: internal subject id>",
  "external_subject_ref": "roblox:12345", 
  "entitlement_type": "achievement",
  "scope": "project",
  "data": { "name": "Alpha Access" },
  "expires_at": null
}
```

Response:
```json
{
  "success": true,
  "entitlement": {
    "id": "...",
    "type": "achievement",
    "scope": "project",
    "created_at": "..."
  }
}
```

## 4) Verify an Entitlement

Endpoint: `POST /api/os/entitlements/verify`

Body:
```json
{ "entitlement_id": "..." }
```

Response (valid):
```json
{
  "valid": true,
  "entitlement": {
    "id": "...",
    "type": "achievement",
    "scope": "project",
    "data": { "name": "Alpha Access" },
    "issuer": { "id": "...", "name": "AeThex Platform", "class": "platform" },
    "issued_at": "...",
    "expires_at": null
  }
}
```

Response (revoked/expired):
```json
{ "valid": false, "reason": "revoked|expired", ... }
```

## 5) Resolve Entitlements (by subject or external ref)

Endpoint: `GET /api/os/entitlements/resolve`

Query params (choose one path):
- `?subject_id=<internal_subject_id>`
- `?platform=roblox&id=12345`

Response:
```json
{
  "entitlements": [
    {
      "id": "...",
      "type": "achievement",
      "scope": "project",
      "data": { "name": "Alpha Access" },
      "issuer": { "name": "AeThex Platform", "class": "platform" },
      "issued_at": "...",
      "expires_at": null
    }
  ]
}
```

## 6) Revoke an Entitlement

Endpoint: `POST /api/os/entitlements/revoke`

Headers:
- `x-issuer-id: <issuer_id>`

Body:
```json
{ "entitlement_id": "...", "reason": "Fraudulent use" }
```

Response:
```json
{ "success": true, "message": "Entitlement revoked" }
```

## Notes
- All OS routes are protected by the capability guard and expect authenticated context where relevant.
- Use Supabase console to inspect tables and audit logs.
- For production, plan issuer key rotation via `aethex_issuer_keys`; rotation endpoints can be added similarly.
