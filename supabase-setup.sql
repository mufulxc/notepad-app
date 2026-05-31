-- ============================================
-- 记事本网站 - Supabase 数据库初始化 SQL
-- 在 Supabase Dashboard → SQL Editor 中运行
-- ============================================

-- 1. 创建设置表（存密码等配置）
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. 插入默认密码（改掉 changeme）
INSERT INTO settings (key, value) VALUES ('site_password', 'changeme')
ON CONFLICT (key) DO NOTHING;

-- 3. 禁止直接读取 settings 表
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all reads" ON settings FOR SELECT USING (false);

-- 4. 创建密码验证函数（服务端比对，不暴露密码）
CREATE OR REPLACE FUNCTION verify_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stored_password TEXT;
BEGIN
    SELECT value INTO stored_password FROM settings WHERE key = 'site_password';
    RETURN stored_password IS NOT NULL AND stored_password = input_password;
END;
$$;

-- 5. 创建记事本表
CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 启用行级安全
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略（允许匿名用户所有操作）
CREATE POLICY "Enable read for all" ON notes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON notes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON notes FOR DELETE USING (true);
