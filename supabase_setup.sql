-- 1. Create profiles table linked to auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create detections table
CREATE TABLE detections (
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

-- 3. Set up Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('pothole-images', 'pothole-images', true);

-- 4. Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read their own, Admin can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Detections: Members can read/insert their own, Admins can read all
CREATE POLICY "Members can view own detections" ON detections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can insert own detections" ON detections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all detections" ON detections FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Storage Policy: Allow authenticated users to upload and read
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'pothole-images');
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pothole-images');
