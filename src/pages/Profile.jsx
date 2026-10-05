import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Key, LogOut, Save, Loader2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Bạn chưa đăng nhập!</h2>
        <button className="btn btn-primary" onClick={() => navigate('/auth')} style={{ marginTop: '16px' }}>
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 1) return;
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const { error } = await supabase
        .from('custom_users')
        .update({ password: newPassword })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local storage manually so they don't get logged out next time they open the app
      const updatedUser = { ...user, password: newPassword };
      localStorage.setItem('roadguard_user', JSON.stringify(updatedUser));
      
      setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });
      setNewPassword('');
    } catch (err) {
      setMessage({ text: 'Lỗi: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>Hồ sơ cá nhân</h1>
      
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <User size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{profile?.username}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              <Shield size={16} color={profile?.role === 'admin' ? 'var(--warning)' : 'var(--text-secondary)'} />
              <span>{profile?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thành viên'}</span>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={20} color="var(--accent-primary)" /> Đổi mật khẩu
        </h3>
        
        {message.text && (
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px', 
            fontSize: '14px',
            background: message.type === 'success' ? 'rgba(81, 207, 102, 0.1)' : 'rgba(255,107,107,0.1)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Mật khẩu mới (Độ dài tùy ý)" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading || !newPassword}>
            {loading ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
            Lưu mật khẩu mới
          </button>
        </form>
      </div>

      <button 
        onClick={handleLogout} 
        className="btn" 
        style={{ width: '100%', background: 'var(--danger)', color: '#fff', padding: '16px', fontSize: '16px', fontWeight: 'bold' }}
      >
        <LogOut size={24} /> ĐĂNG XUẤT TÀI KHOẢN
      </button>
    </div>
  );
}
