-- ============================================================================
-- Index Migration: Composite + Partial Indexes for Query Optimization
-- ============================================================================
-- Execute after RLS migration
-- These indexes optimize the most common query patterns in the application
-- ============================================================================

-- ============================================================================
-- companies
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_status_deleted ON companies(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_companies_plan_type ON companies(plan_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- users
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_company_active ON users(company_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_company ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE is_active = true;

-- ============================================================================
-- sessions
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id) WHERE is_revoked = false AND expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at) WHERE is_revoked = false;

-- ============================================================================
-- login_attempts
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup ON login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_recent ON login_attempts(email, created_at DESC) WHERE success = false;

-- ============================================================================
-- clients
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_company_search ON clients(company_id, name, phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_company_status ON clients(company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_company_created ON clients(company_id, created_at DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- appointments
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_appointments_company_date ON appointments(company_id, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_company_status ON appointments(company_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date_range ON appointments(date, company_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- conversations
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_company_unread ON conversations(company_id, unread DESC, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_company_status ON conversations(company_id, status) WHERE deleted_at IS NULL;

-- ============================================================================
-- uploads
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_uploads_company ON uploads(company_id, created_at DESC);

-- ============================================================================
-- audit_logs
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_action ON audit_logs(company_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- api_keys
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(company_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_key_lookup ON api_keys(key) WHERE is_active = true;

-- ============================================================================
-- webhook_events
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_status ON webhook_events(provider, status, created_at DESC);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- List all indexes:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
