-- =============================================
-- RateSentinel Database Schema
-- MySQL / InnoDB / UTF8MB4
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- TENANTS
-- =============================================
CREATE TABLE tenants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  kill_switch BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'developer', 'viewer') NOT NULL,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_tenant (tenant_id),

  CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- APIS
-- =============================================
CREATE TABLE apis (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  environment ENUM('dev', 'staging', 'prod') NOT NULL,
  base_url VARCHAR(512),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_apis_tenant (tenant_id),

  CONSTRAINT fk_apis_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- API KEYS
-- =============================================
CREATE TABLE api_keys (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_id BIGINT NOT NULL,
  key_hash CHAR(64) NOT NULL UNIQUE,
  status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_api_keys_api (api_id),

  CONSTRAINT fk_api_keys_api
    FOREIGN KEY (api_id)
    REFERENCES apis(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- RATE RULES
-- =============================================
CREATE TABLE rate_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_id BIGINT NOT NULL,
  scope ENUM('api', 'api_key', 'user', 'ip') NOT NULL,
  limit_value INT NOT NULL,
  interval_seconds INT NOT NULL,
  burst_limit INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_rate_rules_api (api_id),

  CONSTRAINT fk_rate_rules_api
    FOREIGN KEY (api_id)
    REFERENCES apis(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- REQUEST LOGS
-- =============================================
CREATE TABLE requests_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  api_id BIGINT NOT NULL,
  api_key_id BIGINT,
  user_id BIGINT,
  ip_address VARCHAR(45),
  method VARCHAR(10),
  path VARCHAR(512),
  status_code INT,
  decision ENUM('allowed', 'throttled', 'blocked'),
  latency_ms INT,
  snapshot_s3_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_requests_tenant_time (tenant_id, created_at),
  INDEX idx_requests_api (api_id),
  INDEX idx_requests_decision (decision),

  CONSTRAINT fk_requests_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_requests_api
    FOREIGN KEY (api_id)
    REFERENCES apis(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_requests_api_key
    FOREIGN KEY (api_key_id)
    REFERENCES api_keys(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- BLOCKED EVENTS
-- =============================================
CREATE TABLE blocked_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  api_id BIGINT,
  block_type ENUM('ip', 'api_key', 'user', 'global'),
  identifier VARCHAR(255),
  reason VARCHAR(512),
  expires_at TIMESTAMP NULL,
  unblocked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_blocked_tenant (tenant_id),
  INDEX idx_blocked_identifier (identifier),

  CONSTRAINT fk_blocked_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_blocked_api
    FOREIGN KEY (api_id)
    REFERENCES apis(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- ALERTS
-- =============================================
CREATE TABLE alerts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  type ENUM('spike', 'error_rate', 'abuse', 'system'),
  severity ENUM('low', 'medium', 'high', 'critical'),
  message VARCHAR(1024),
  metadata JSON,
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_alerts_tenant (tenant_id),
  INDEX idx_alerts_severity (severity),

  CONSTRAINT fk_alerts_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;