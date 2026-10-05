-- 1. Xóa các bảng cũ (Nếu có) để setup lại từ đầu không dùng Email
DROP TABLE IF EXISTS detections CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS custom_users CASCADE;

-- 2. Tạo bảng custom_users (Đăng nhập hoàn toàn bằng ID, không cần Email, không Rate Limit)
CREATE TABLE custom_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tạo bảng detections (Lưu lịch sử quét)
CREATE TABLE detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES custom_users(id),
  class_name TEXT NOT NULL,
  confidence FLOAT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  severity TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Setup Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pothole-images', 'pothole-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Cho phép public truy cập (Bỏ qua RLS phức tạp của Supabase Auth)
ALTER TABLE custom_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE detections DISABLE ROW LEVEL SECURITY;

-- 6. Setup quyền cho Storage (Ai cũng được upload)
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'pothole-images');
CREATE POLICY "Allow all uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pothole-images');

SELECT 'Setup Custom Auth complete' as status;
