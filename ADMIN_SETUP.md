# Workshop CMS: Secure Administrator Setup

The CMS at `/admin` uses the project’s existing **Manus OAuth** sign-in. Browser sign-in establishes a server-verified session, and every product/content mutation is protected on the server by the persisted `users.role` value. The browser UI is a convenience layer; it is not the authority for admin access.

## How the first administrator is assigned

The recommended first administrator is the **project owner**. This full-stack template receives `OWNER_OPEN_ID` as a protected platform environment variable. When that owner signs in successfully for the first time, the application creates their row in `users` with `role = 'admin'`. On later sign-ins, the same owner is deliberately re-promoted, so a routine OAuth update cannot accidentally remove bootstrap access.

> Sign in once with the account that owns the Manus project, then visit `/admin`. No source-code change or client-side configuration is required for this standard setup.

| Setup path | When to use it | Result |
|---|---|---|
| **Project-owner bootstrap** | First administrator is the Manus project owner | The `OWNER_OPEN_ID` match receives `admin` automatically on sign-in. |
| **Database promotion** | A colleague or a different account must administer the CMS | Promote the specific existing `openId` in `users`. |

## Promote an additional administrator in the database

The person must sign in once first, so their identity is recorded. In the project Database panel or an approved database migration/query workflow, identify the OAuth identity by its **`openId`**, not just by email address:

```sql
SELECT id, openId, name, email, role, lastSignedIn
FROM users
ORDER BY lastSignedIn DESC;
```

Then promote only the intended account:

```sql
UPDATE users
SET role = 'admin'
WHERE openId = '<EXACT_OPEN_ID>';
```

The role is read from the database on each protected request, so the person can refresh `/admin` to obtain access. To revoke CMS access, run the inverse operation:

```sql
UPDATE users
SET role = 'user'
WHERE openId = '<EXACT_OPEN_ID>';
```

Do not demote the project-owner account unless another administrator has already been verified. The configured `OWNER_OPEN_ID` is intended as the recovery/bootstrap administrator and will be promoted again when it signs in.

## Environment-variable guidance

`OWNER_OPEN_ID` is supplied as a protected project environment variable. It is the appropriate environment-based mechanism for **one owner bootstrap account**. Do not expose it in frontend variables, commit it to source control, or replace it with an email address. OAuth identifiers are authoritative and stable for role matching; emails are display information only.

For multiple administrators, use the database `users.role` model above. This avoids putting a mutable list of privileged users into source code or browser configuration.

## Security checklist

| Control | Current behavior |
|---|---|
| OAuth request integrity | A one-time state nonce is bound to a host-only secure cookie before token exchange. |
| Session handling | The server issues a signed, HTTP-only session cookie. |
| Authorization | CMS procedures use `adminProcedure`; a UI route check alone cannot grant access. |
| Role source of truth | The authenticated request loads `role` from the database. |
| Bootstrap safety | The configured owner is promoted; other users keep their existing database role on normal sign-in. |

If a browser blocks all cookies, OAuth sign-in cannot complete. Use an up-to-date browser with normal cookie settings and access the deployed site via HTTPS.
