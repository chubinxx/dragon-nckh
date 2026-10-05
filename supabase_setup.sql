-- 1. Create profiles table linked to auth.users (Tạo bảng profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create detections table (Tạo bảng lưu dữ liệu ổ gà)
CREATE TABLE IF NOT EXISTS detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  class_name TEXT NOT NULL,
  confidence FLOAT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  image_url TEXT,
  severity TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Set up Storage (Tạo bucket lưu ảnh, nếu có rồi thì bỏ qua)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pothole-images', 'pothole-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Row Level Security (Bật bảo mật)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có để tránh lỗi trùng lặp khi chạy lại
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Members can view own detections" ON detections;
DROP POLICY IF EXISTS "Members can insert own detections" ON detections;
DROP POLICY IF EXISTS "Admins can view all detections" ON detections;
DROP POLICY IF EXISTS "Public can view all detections" ON detections;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 5. Tạo Policies mới cho Profiles
-- SỬA LỖI RECURSION: Cho phép ai cũng có thể đọc bảng profile (để hiện tên người phát hiện). Không dùng check Admin ở đây để tránh đệ quy vô hạn.
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Tạo Policies mới cho Detections
CREATE POLICY "Members can view own detections" ON detections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can insert own detections" ON detections FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Check Admin ở bảng detections thì hoàn toàn hợp lệ (không đệ quy)
CREATE POLICY "Admins can view all detections" ON detections FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Cho phép đọc public tất cả detections (để load lên bản đồ cho khách)
CREATE POLICY "Public can view all detections" ON detections FOR SELECT USING (true);

-- 7. Tạo Policies cho Storage
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'pothole-images');
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pothole-images');

SELECT 'Setup complete' as status;
