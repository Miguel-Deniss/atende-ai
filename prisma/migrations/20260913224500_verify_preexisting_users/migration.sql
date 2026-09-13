-- Email verification became mandatory on 2026-09-12. Users created before
-- that deployment were already allowed to access the product and must not be
-- locked out because an undelivered resend attempt created a token afterward.
UPDATE "users"
SET "emailVerified" = true,
    "emailVerificationToken" = NULL,
    "emailVerificationExpires" = NULL
WHERE "emailVerified" = false
  AND "createdAt" < TIMESTAMP '2026-09-12 00:00:00';
