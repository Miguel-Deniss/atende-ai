-- Accounts created before email verification became mandatory never received a
-- verification token. Preserve access for those legacy users while keeping
-- verification mandatory for every new registration, which always has a token.
UPDATE "users"
SET "emailVerified" = true
WHERE "emailVerified" = false
  AND "emailVerificationToken" IS NULL
  AND "emailVerificationExpires" IS NULL;
