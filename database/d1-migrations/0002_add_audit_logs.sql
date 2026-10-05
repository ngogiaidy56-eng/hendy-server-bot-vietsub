-- 0002_add_audit_logs.sql
-- Cloudflare D1 Schema for Admin RBAC Audit Trail & Edge Gateway Security Events

CREATE TABLE IF NOT EXISTS security_audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  source_client TEXT NOT NULL,
  route TEXT NOT NULL,
  hmac_signature TEXT NOT NULL,
  http_status INTEGER NOT NULL,
  payload_summary TEXT NOT NULL,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_route ON security_audit_logs(route);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON security_audit_logs(created_at DESC);
