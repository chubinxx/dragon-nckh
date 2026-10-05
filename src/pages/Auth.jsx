import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member'); // Default for signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Format username to email under the hood for Supabase Auth
    const formattedUsername = email.includes('@') ? email : `${email.replace(/\s+/g, '')}@roadguard.com`;

    try {
      if (isLogin) {
        await signIn(formattedUsername, password);
        navigate('/');
      } else {
        await signUp(formattedUsername, password, role);
        navigate('/');
      }
    } catch (err) {
      if (err.message.includes('Email not confirmed')) {
        setError('Lỗi: Bạn cần tắt tính năng "Confirm email" trong cài đặt Supabase (Authentication > Providers > Email).');
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Sai tên đăng nhập hoặc mật khẩu.');
      } else {
        setError(err.message || 'Đã có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Shield size={48} color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>RoadGuard AI</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(255,107,107,0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tên đăng nhập (Ví dụ: admin)" 
              style={{ paddingLeft: '40px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Mật khẩu" 
              style={{ paddingLeft: '40px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>Vai trò:</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Thành viên (Đi quét đường)</option>
                <option value="admin">Admin (Xem thống kê tổng)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? <Loader2 className="spin" size={20} /> : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--accent-light)', fontWeight: '600' }}
          >
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
