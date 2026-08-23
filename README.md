# Chittapawan Brahman Sangh Business Directory

A community business directory built with Next.js 16 and MongoDB. Business owners submit a public application; administrators privately review it; only approved listings appear in the searchable directory.

## Workflows

- `/join` — public six-step business application
- `/join/success` — acknowledgement and reference number
- `/directory` — public search of approved listings only
- `/admin` — protected review queue with pending, approved, and rejected states
- `/admin/applications/[id]` — full application, private notes, approve/reject controls
- `/admin/export` — authenticated CSV export of the active queue/search
- `/admin/changes` — protected owner-correction review queue
- `/update/[token]` — expiring one-time owner correction form

New submissions are normalized and compared by email, phone, and business name. Similar records are marked as possible duplicates for administrator review but are never rejected automatically.

Legacy MongoDB records without a `status` are treated as approved so the Supabase migration does not make existing listings disappear. Run the idempotent migration below to backfill them explicitly.

## Local setup

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI`, `MONGODB_DB`, and a long random `AUTH_SESSION_SECRET`.
2. Install and normalize the database:

   ```bash
   npm install
   npm run mongodb:migrate
   npm run mongodb:audit
   ```

3. Create each administrator. Keep the password out of shell history:

   ```bash
   ADMIN_PASSWORD='use-a-long-unique-password' npm run admin:create -- --email admin@example.org --name "Admin Name"
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

## MongoDB collections

- `directory_members` — applications and approved listings
- `member_uploads` — images/PDFs stored as separate BSON documents (images are resized and converted to WebP)
- `directory_admins` — scrypt password hashes and active status
- `rate_limits` — short-lived login/submission throttles (TTL indexed)
- `directory_edit_tokens` — SHA-256 hashes of one-time, 14-day correction links
- `directory_change_requests` — proposed owner changes held separately until admin approval

New applications use `schema_version: 3` and begin with `status: "pending"`. Review metadata records the timestamp and administrator identity. Pending/rejected uploads are available only to signed-in admins; uploads linked to approved listings can be served publicly.

## Free deployment

The application has no paid package dependency. It can run on a free Node-compatible host with MongoDB Atlas's free cluster tier. File uploads currently live in MongoDB to avoid requiring another service; for a larger directory, move media to a free object-storage allowance and keep only file keys in MongoDB.

## Checks

```bash
npm run lint
npm run build
npm run mongodb:audit
```
