# Jenny email templates

Branded HTML emails for Supabase Auth. Paste each file into
**Supabase Dashboard > Authentication > Emails (Email Templates)** for project `iazotenpvctpqwthabci`.

| Template in Supabase | File | Suggested subject |
|---|---|---|
| Confirm signup | confirm-signup.html | Confirm your email for Jenny |
| Reset password | reset-password.html | Reset your Jenny password |
| Magic link | magic-link.html | Your Jenny sign-in link |
| Change email address | change-email.html | Confirm your new Jenny email |
| Invite user | invite.html | You're invited to Jenny |
| Reauthentication | reauthentication.html | Your Jenny confirmation code |

The files use Supabase variables (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`). Keep them as they are.

## Sender name and address
Supabase's built-in mailer is for testing: it is rate limited (a few emails per hour) and the sender can't be changed.
For real users, turn on **custom SMTP** (Authentication > SMTP Settings) with a provider such as Resend, Brevo or Postmark,
and set the sender name to `Jenny` and the address to something on your own domain (for example `hello@yourdomain.com`).
Without your own domain, emails may land in spam.

## Also set
- Authentication > URL Configuration: Site URL `https://jenny-ke.vercel.app`, add `https://jenny-ke.vercel.app/auth/callback` to redirect URLs.
