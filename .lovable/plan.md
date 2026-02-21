

## Forgot Password / Reset Password Flow

Add a complete password recovery flow using Supabase's built-in `resetPasswordForEmail` and `updateUser` APIs. No edge functions or external email services needed -- Supabase sends the reset email automatically.

### Changes

**1. Add "Forgot Password" link to Login**
- In `src/components/auth/LoginForm.tsx`, add a "Forgot your password?" link below the password field
- Clicking it navigates to a new `/forgot-password` page

**2. Create Forgot Password page** (`src/pages/auth/ForgotPasswordPage.tsx`)
- Simple form: email input + "Send Reset Link" button
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Shows success message after submission (regardless of whether email exists, for security)

**3. Create Reset Password page** (`src/pages/auth/ResetPasswordPage.tsx`)
- On mount, listens for `PASSWORD_RECOVERY` event via `supabase.auth.onAuthStateChange`
- Shows a "New Password" + "Confirm Password" form
- Calls `supabase.auth.updateUser({ password })` to set the new password
- On success, redirects to `/login` with a toast confirmation

**4. Add routes in `src/App.tsx`**
- `/forgot-password` -> `ForgotPasswordPage`
- `/reset-password` -> `ResetPasswordPage`
- Both are public routes (alongside `/login` and `/register`)

### Technical Notes

- Supabase handles the reset email delivery using its built-in email templates -- no Resend or edge function needed
- The `redirectTo` URL must point to `/reset-password` so the user lands on the correct page with the recovery token in the URL hash
- The `/reset-password` page must NOT be behind auth protection since the user isn't logged in yet
- The `PASSWORD_RECOVERY` event auto-signs the user in with a temporary session, allowing `updateUser` to work

