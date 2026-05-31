-- ============================================
-- 记事本网站 - Supabase 数据库初始化 SQL
-- 在 Supabase Dashboard → SQL Editor 中运行
-- ============================================

-- 1. 创建记事本表
CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用行级安全
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略（允许匿名用户所有操作）
CREATE POLICY "Enable read for all" ON notes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all" ON notes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all" ON notes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all" ON notes
    FOR DELETE USING (true);

-- 4. 如果 taobao_stock_qty 表也需要开放只读（已有表，只需加策略）
-- CREATE POLICY "Enable read for all" ON taobao_stock_qty
--     FOR SELECT USING (true);
