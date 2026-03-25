-- ==========================================
-- World Spirits 管理画面 - Supabase セットアップ
-- ==========================================

-- コンテンツテーブル
CREATE TABLE IF NOT EXISTS public.site_content (
  section_id text PRIMARY KEY,
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- RLS有効化
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能（公開サイト用）
CREATE POLICY "Public read access" ON public.site_content
  FOR SELECT USING (true);

-- 認証済みユーザーのみ書き込み可能
CREATE POLICY "Authenticated insert" ON public.site_content
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update" ON public.site_content
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 画像ストレージバケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT DO NOTHING;

-- 画像の公開読み取り
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-images');

-- 認証済みユーザーの画像アップロード
CREATE POLICY "Auth upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');
