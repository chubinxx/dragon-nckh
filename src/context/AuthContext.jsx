import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Custom Auth: Read from localStorage on mount
    const savedUser = localStorage.getItem('roadguard_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setProfile(parsed);
      } catch (e) {
        localStorage.removeItem('roadguard_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username, password) => {
    const { data, error } = await supabase
      .from('custom_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    
    if (error || !data) {
      throw new Error('Sai tên đăng nhập hoặc mật khẩu');
    }

    localStorage.setItem('roadguard_user', JSON.stringify(data));
    setUser(data);
    setProfile(data);
    return data;
  };
  
  const signUp = async (username, password, role = 'member') => {
    // Check if user exists
    const { data: existing } = await supabase
      .from('custom_users')
      .select('id')
      .eq('username', username)
      .single();
      
    if (existing) {
      throw new Error('Tên đăng nhập đã tồn tại!');
    }

    const { data, error } = await supabase
      .from('custom_users')
      .insert([{ username, password, role }])
      .select()
      .single();
      
    if (error) {
      throw new Error('Lỗi tạo tài khoản: ' + error.message);
    }
    
    localStorage.setItem('roadguard_user', JSON.stringify(data));
    setUser(data);
    setProfile(data);
    return data;
  };

  const signOut = () => {
    localStorage.removeItem('roadguard_user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
