# Jenny — Connect. Discover. Belong.

Mobile-first social platform (Kenya first). Next.js (App Router) + TypeScript + Tailwind + Supabase.

## Status (read this first)

| Area | State |
|---|---|
| Supabase project `Jenny` (`iazotenpvctpqwthabci`, eu-central-1) | Connected. Schema, RLS, storage and indexes applied live via 5 migrations. |
| Branding: logo SVGs, PNG icons, maskable icon, OG image, favicon | Done and visually checked. |
| Landing, auth, PWA files, offline page | **Written, NOT built or run** (build sandbox could not reach the npm registry). |
| Milestone 3 screens: app shell + nav, home feed (cursor "load older"), composer, post detail with comments, likes, delete, profile pages, follow/unfollow/requests, block, report, people search, profile settings, notifications | **Written, NOT built or run.** |
| RLS isolation tests | **Written (`supabase/tests/rls_isolation.sql`), NOT run.** Running it from the build session was cancelled twice. Run it in the Supabase SQL editor: every line must say PASS. |
| Photo uploads (profile photo, one image per post; type sniffed from file bytes, size-limited, orphan cleanup) and private messaging (conversation list, thread, send, unread dot, 6-8s auto-refresh) | **Written, NOT built or run.** |
| Businesses: directory with search + category filter, public business page with listings and enquiry form, owner dashboard (create/edit profile, add/publish/delete listings, enquiries inbox), report-as-fraud | **Written, NOT built or run.** |
| News page (published stories with honest labels, source links, story-tip form; nothing auto-publishes) | **Written, NOT built or run.** |
| Admin app (`admin/`, separate Next.js app): staff sign-in + mandatory authenticator-app 2FA, overview counts, reports queue (hide/remove/dismiss), business approval/suspension/verification, news review, user suspension, audit log | **Written, NOT built or run, NOT security-tested.** Needs your `service_role` key. |
| Cover photos, business logos, community topics UI, comment replies, account deletion handling, dating | Not started (tables exist). |

Partial check done: a TypeScript pass over `src/` with stubbed Next/React/Supabase/zod types found no errors in the project's own code. That is NOT a build: it cannot catch wrong library usage, Tailwind/ESLint issues, or runtime bugs. Run the real build first.

Nothing here should be called production-ready.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```

`.env.local` is pre-filled with your project URL and **publishable** key (public by design).
Never put the `service_role` key in a `NEXT_PUBLIC_` variable or commit it.

### Supabase dashboard settings to check
1. **Auth → URL Configuration**: Site URL = your deployed URL; add `http://localhost:3000/auth/callback` and the production `/auth/callback` to Redirect URLs.
2. **Auth → Providers → Email**: keep "Confirm email" ON.
3. **Auth → SMTP**: configure a real sender. The built-in mailer is heavily rate-limited and for testing only.
4. **Auth → Attack protection**: enable leaked-password protection and CAPTCHA before launch.

## Database (applied via Supabase MCP, in order)
1. `001_core_identity` — profiles, preferences, follows, blocks, admin_roles, signup trigger, security helpers (private schema), profile search RPCs.
2. `002_social_content` — posts, media, comments, reactions, bookmarks, notifications (+ preference-aware triggers), feed RPC.
3. `003_business_community_messaging_moderation` — businesses/members/listings/enquiries, topics, news submissions, conversations/messages, reports, moderation actions, audit log (append-only), consents, deletion requests.
4. `004_storage_buckets` — avatars, covers, post-media, business-logos (images only, size-limited, per-owner folders).
5. `005_foreign_key_indexes` — covering indexes for foreign keys (from the Supabase performance advisor).

To keep these in git, run `supabase link --project-ref iazotenpvctpqwthabci && supabase db pull`.

Security design: RLS on every table; column-level grants so users can only update fields they own; helper functions live in a non-exposed `private` schema; staff checks require MFA (`aal2`); audit/moderation logs reject UPDATE/DELETE; rate-limit triggers on posts, comments, messages, follows, reports, enquiries.
Advisor note: 3 intentional WARNs (`lookup_profile`, `search_profiles`, `start_conversation` are signed-in-only RPCs that check the caller internally).

## Verify before moving on (not done yet)
- Run `supabase/tests/rls_isolation.sql` in the SQL editor first.
- RLS tests with two ordinary users, an outsider, a blocked user and anon: cannot edit/delete others' posts, read others' messages, self-grant admin, bypass private profiles, or message after a block.
- Register → verify email → sign in → `/home` shows your profile.
- PWA: install on Android, test offline page, test the update prompt (production build only).

## Known limitations / decisions
- Username already taken at signup: the DB trigger assigns a temporary `user_xxxx` name instead of failing. Add a profile-setup screen (Milestone 2) to choose a final one.
- Admin roles are provisioned server-side only (SQL / service role); no public path assigns them. The separate admin app is Milestone 6.
- Public legal pages are honest placeholders marked "not legally reviewed". Get real Terms/Privacy reviewed for Kenyan data-protection requirements before launch.
- Dating is disabled: no tables, no routes beyond the middleware-protected `/dating` prefix.
- The logo wordmark in the standalone SVGs uses text (Inter, with fallbacks). Convert to outlines for print.

## Milestone 3 limitations (known)
- One photo per post; no resizing/compression yet (uploads are stored as sent, max 5 MB). Add image transforms before heavy use on mobile data.
- Profile and post photos live in PUBLIC buckets. Paths are unguessable but anyone with a link can open them, even for private profiles.
- Messages refresh by polling every few seconds, not instant push. Supabase Realtime can replace this later. Messages are protected by access rules but are NOT end-to-end encrypted.
- Message list preview/unread uses the latest 200 messages across your conversations; very busy accounts need a dedicated query.
- "Report" on a post files an "other" report with no confirmation message and no reason picker yet.
- Likes are a single "like" reaction. No comment replies UI yet (database supports `parent_id`).
- Search covers people only (not posts, businesses or topics).
- Profile, post and search pages require sign-in for now. Public exploring comes with the public pages milestone.
- No automated tests besides the SQL isolation script.

## Admin app (`admin/`)
A separate Next.js app (own `package.json`, port 3001) for staff. Deploy it as its own Vercel project with root directory `admin` on its own domain (e.g. `admin.yourdomain.co.ke`). The public app never links to it.

Security model: every page AND every server action calls `requireStaff()`, which checks (1) a valid session, (2) a row in `admin_roles` read from the database, (3) an allowed role for that screen, (4) a verified authenticator-app code this session (aal2). Privileged writes use the service-role key on the server only; each one is written to the append-only `admin_audit_logs`. A hidden URL is not the protection; the checks are.

Setup:
```bash
cd admin
cp .env.example .env.local     # add SUPABASE_SERVICE_ROLE_KEY (Dashboard > Project Settings > API). Never commit it.
npm install && npm run dev      # http://localhost:3001
```
Create the first staff account (no public path can grant staff roles):
1. Register a normal account in the public app (or create the user in Supabase Dashboard > Auth > Users).
2. In the SQL editor run (replace the email):
```sql
insert into public.admin_roles (user_id, role)
select id, 'system_owner' from auth.users where email = 'YOU@EXAMPLE.COM';
```
3. Sign in at the admin app, scan the QR code with an authenticator app, enter the 6-digit code.

Roles: `system_owner` and `administrator` (everything, including audit log, reinstating users, verified badges), `moderator` (reports, approvals, news, suspensions), `support` (sign-in only for now; no screens yet).

Admin limitations: no UI to add/remove staff (use SQL), no account-deletion handling, no appeals queue, no way to restore hidden content from the UI, suspension does not sign the user out of existing sessions (it blocks posting/visibility via database rules), no private-message access by design. Enable "Auth > Attack protection" (CAPTCHA) and consider restricting the admin domain by IP/firewall.

Business limitations: businesses start `pending_review` and are approved in the admin app; one business per owner in the UI, no logo upload yet, no team-member invites yet (the database supports managers), enquiries notify the team in-app only (no email yet).
