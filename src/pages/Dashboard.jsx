import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ total: 0, today: 0, high_severity: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    
    const fetchStats = async () => {
      let query = supabase.from('detections').select('id, severity, created_at', { count: 'exact' });
      
      // If member, only show their own detections
      if (profile.role === 'member') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, count, error } = await query;
      
      if (!error && data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const today = data.filter(d => d.created_at.startsWith(todayStr)).length;
        const high = data.filter(d => d.severity === 'high').length;
        
        setStats({ total: count || 0, today, high_severity: high });
      }
      setLoading(false);
    };
    
    fetchStats();
  }, [profile, user]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Tổng quan hệ thống
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Xin chào, {profile?.email} ({profile?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'})
        </p>
      </header>

      {profile?.role === 'member' && (
        <div style={{ marginBottom: '32px' }}>
          <Link to="/scan" className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
            <Activity size={24} /> BẮT ĐẦU QUÉT ĐƯỜNG
          </Link>
        </div>
      )}

      {loading ? (
        <div>Đang tải thống kê...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <CheckCircle color="var(--accent-primary)" />
              <span style={{ color: 'var(--text-secondary)' }}>Tổng số báo cáo</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats.total}</div>
          </div>
          
          <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <AlertTriangle color="var(--warning)" />
              <span style={{ color: 'var(--text-secondary)' }}>Hôm nay</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{stats.today}</div>
          </div>

          <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <ShieldAlert color="var(--danger)" />
              <span style={{ color: 'var(--text-secondary)' }}>Nghiêm trọng</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--danger)' }}>{stats.high_severity}</div>
          </div>
        </div>
      )}
    </div>
  );
}
