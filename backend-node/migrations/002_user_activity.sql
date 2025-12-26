-- Migration: 002_user_activity.sql
-- User Activity Tracking System with PII Compliance
-- Created: 2025-12-25

-- ============================================
-- 1. CONSENT CONTENT TABLE (Admin-managed)
-- Only one version can be active at a time
-- ============================================
CREATE TABLE IF NOT EXISTS consent_content (
    id          SERIAL PRIMARY KEY,
    version     TEXT UNIQUE NOT NULL,
    title       TEXT NOT NULL DEFAULT 'Activity Tracking Consent',
    content     TEXT NOT NULL,
    summary     TEXT,
    is_active   BOOLEAN DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by  TEXT
);

-- Only one active consent version at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_consent_active 
    ON consent_content(is_active) 
    WHERE is_active = true;

-- Insert default consent content
INSERT INTO consent_content (version, title, content, summary, is_active, created_by)
VALUES (
    '1.0',
    'Activity Tracking Consent',
    'To provide you with the best learning experience, we track your activity on Codenium. This includes:

• **Progress Tracking**: Which problems you have started and solved
• **Time Analytics**: How much time you spend on each problem
• **Session Data**: Login sessions for personalized experience
• **Code Submissions**: Your code attempts for progress tracking

Your data is stored securely and never shared with third parties. By clicking "Accept", you agree to this data collection to enhance your learning journey.',
    'We collect problem progress, time spent, and session data to improve your learning experience.',
    true,
    'system'
) ON CONFLICT (version) DO NOTHING;

-- ============================================
-- 2. USERS TABLE (Core Identity)
-- Stores authenticated user profiles from Google OAuth
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    google_id       TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    name            TEXT,
    picture         TEXT,
    
    -- Consent tracking (references consent_content.version)
    consent_version TEXT,
    consent_at      TIMESTAMP WITH TIME ZONE,
    
    -- Privacy-safe geolocation (from hashed IP lookup)
    geo_city        TEXT,
    geo_country     TEXT,
    
    -- Timestamps
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Account status
    is_active       BOOLEAN DEFAULT true
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_consent ON users(consent_version);

-- ============================================
-- 3. SITE SETTINGS TABLE (Application Customization)
-- Admin-managed settings stored as JSONB for flexibility
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by  TEXT
);

-- Insert default settings
INSERT INTO site_settings (key, value, updated_by) VALUES
    ('app_name', '"Codenium"', 'system'),
    ('theme', '{"primary": "#7C3AED", "dark": true}', 'system'),
    ('features', '{"tutor": true, "playground": true, "visualizer": true}', 'system'),
    ('announcements', '[]', 'system')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (auth.uid()::text = google_id);

-- Consent content is readable by all, writable by none (admin API bypasses RLS)
CREATE POLICY consent_read_all ON consent_content
    FOR SELECT
    USING (true);

-- Site settings readable by all
CREATE POLICY settings_read_all ON site_settings
    FOR SELECT
    USING (true);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for consent_content
DROP TRIGGER IF EXISTS consent_content_updated ON consent_content;
CREATE TRIGGER consent_content_updated
    BEFORE UPDATE ON consent_content
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp();

-- Trigger for site_settings
DROP TRIGGER IF EXISTS site_settings_updated ON site_settings;
CREATE TRIGGER site_settings_updated
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp();

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE users IS 'Core user identity from Google OAuth with consent tracking';
COMMENT ON TABLE consent_content IS 'Admin-managed consent versions with content';
COMMENT ON TABLE site_settings IS 'Application customization settings as JSONB';

COMMENT ON COLUMN users.consent_version IS 'Version of consent user has accepted';
COMMENT ON COLUMN users.geo_city IS 'City-level location (PII compliant - no precise coords)';
COMMENT ON COLUMN users.geo_country IS 'Country code (e.g., US, UK)';
