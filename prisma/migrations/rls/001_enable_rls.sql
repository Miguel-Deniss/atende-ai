-- ============================================================================
-- RLS Migration: Enable Row Level Security + Policies for All Tables
-- ============================================================================
-- Execute: psql $DATABASE_URL -f prisma/migrations/rls/001_enable_rls.sql
-- Or via: psql -h localhost -U postgres -d atendeai -f prisma/migrations/rls/001_enable_rls.sql
-- ============================================================================

-- 1. HELPER: Extract user_id from JWT set by Supabase Auth
-- Returns NULL if not authenticated via Supabase
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS TEXT
  LANGUAGE SQL STABLE
  AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::TEXT; $$;

-- 2. HELPER: Extract company_id from custom JWT claim
CREATE OR REPLACE FUNCTION auth.company_id() RETURNS TEXT
  LANGUAGE SQL STABLE
  AS $$ SELECT NULLIF(current_setting('request.jwt.claim.company_id', TRUE), '')::TEXT; $$;

-- 3. HELPER: Extract user role from custom JWT claim
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT
  LANGUAGE SQL STABLE
  AS $$ SELECT NULLIF(current_setting('request.jwt.claim.role', TRUE), '')::TEXT; $$;

-- 4. HELPER: Check if user is an admin (global)
CREATE OR REPLACE FUNCTION auth.is_admin() RETURNS BOOLEAN
  LANGUAGE SQL STABLE
  AS $$ SELECT auth.user_role() = 'ADMIN'; $$;

-- ============================================================================
-- TABLE: companies
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Admins can see all companies
CREATE POLICY companies_admin_all ON companies
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Users can see their own company
CREATE POLICY companies_own_select ON companies
  FOR SELECT
  TO authenticated
  USING (id = auth.company_id());

-- Users cannot modify their company (admin only)
CREATE POLICY companies_own_update ON companies
  FOR UPDATE
  TO authenticated
  USING (id = auth.company_id() AND auth.user_role() = 'ADMIN')
  WITH CHECK (id = auth.company_id() AND auth.user_role() = 'ADMIN');

-- ============================================================================
-- TABLE: users
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins can see all users
CREATE POLICY users_admin_all ON users
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Users can see other users in their own company
CREATE POLICY users_company_select ON users
  FOR SELECT
  TO authenticated
  USING (company_id = auth.company_id());

-- Users can update their own record
CREATE POLICY users_self_update ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.user_id())
  WITH CHECK (id = auth.user_id());

-- ============================================================================
-- TABLE: sessions
-- ============================================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_self_all ON sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.user_id())
  WITH CHECK (user_id = auth.user_id());

CREATE POLICY sessions_admin_all ON sessions
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: login_attempts
-- ============================================================================
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY login_attempts_admin_all ON login_attempts
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- Users can see their own login attempts
CREATE POLICY login_attempts_self_select ON login_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.user_id());

-- ============================================================================
-- TABLE: company_settings
-- ============================================================================
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_settings_company_all ON company_settings
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY company_settings_admin_all ON company_settings
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: ai_configs
-- ============================================================================
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_configs_company_all ON ai_configs
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY ai_configs_admin_all ON ai_configs
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: services
-- ============================================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_company_all ON services
  FOR ALL
  TO authenticated
  USING (ai_config_id IN (SELECT id FROM ai_configs WHERE company_id = auth.company_id()))
  WITH CHECK (ai_config_id IN (SELECT id FROM ai_configs WHERE company_id = auth.company_id()));

-- ============================================================================
-- TABLE: faqs
-- ============================================================================
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY faqs_company_all ON faqs
  FOR ALL
  TO authenticated
  USING (ai_config_id IN (SELECT id FROM ai_configs WHERE company_id = auth.company_id()))
  WITH CHECK (ai_config_id IN (SELECT id FROM ai_configs WHERE company_id = auth.company_id()));

-- ============================================================================
-- TABLE: clients
-- ============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_company_all ON clients
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY clients_admin_all ON clients
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: appointments
-- ============================================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointments_company_all ON appointments
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY appointments_admin_all ON appointments
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_company_all ON conversations
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY conversations_admin_all ON conversations
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: uploads
-- ============================================================================
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY uploads_company_all ON uploads
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY uploads_admin_all ON uploads
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_company_select ON audit_logs
  FOR SELECT
  TO authenticated
  USING (company_id = auth.company_id());

CREATE POLICY audit_logs_admin_all ON audit_logs
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: api_keys
-- ============================================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_company_all ON api_keys
  FOR ALL
  TO authenticated
  USING (company_id = auth.company_id())
  WITH CHECK (company_id = auth.company_id());

CREATE POLICY api_keys_admin_all ON api_keys
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- TABLE: webhook_events
-- ============================================================================
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_admin_all ON webhook_events
  FOR ALL
  TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ============================================================================
-- STORAGE BUCKET POLICIES (for Supabase Storage)
-- Run these after creating storage buckets in Supabase dashboard
-- ============================================================================
-- CREATE POLICY storage_company_all ON storage.objects
--   FOR ALL
--   TO authenticated
--   USING (bucket_id = 'company-uploads' AND (storage.foldername(name))[1] = auth.company_id())
--   WITH CHECK (bucket_id = 'company-uploads' AND (storage.foldername(name))[1] = auth.company_id());

-- ============================================================================
-- REVOKE: Ensure no default public access
-- ============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Grant authenticated role basic access (policies handle the rest)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- List all tables with RLS enabled:
-- SELECT relname FROM pg_class WHERE relrowsecurity = true AND relkind = 'r';
--
-- List all RLS policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies ORDER BY tablename;

-- ============================================================================
-- ROLLBACK (if needed):
-- ============================================================================
-- SELECT 'ALTER TABLE ' || tablename || ' DISABLE ROW LEVEL SECURITY;'
-- FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- DROP FUNCTION IF EXISTS auth.user_id();
-- DROP FUNCTION IF EXISTS auth.company_id();
-- DROP FUNCTION IF EXISTS auth.user_role();
-- DROP FUNCTION IF EXISTS auth.is_admin();
