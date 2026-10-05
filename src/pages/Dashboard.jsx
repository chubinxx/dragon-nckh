import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert, Users, TrendingUp, Download } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ 
    total: 0, 
    today: 0, 
    high_severity: 0,
    total_users: 0,
    by_class: {},
    by_severity: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      let query = supabase.from('detections').select('id, severity, class_name, created_at', { count: 'exact' });
      
      if (profile?.role === 'member') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, count, error } = await query;
      
      // Fetch users if admin
      let userCount = 0;
      if (profile?.role === 'admin') {
        const { count: uc } = await supabase.from('custom_users').select('id', { count: 'exact' });
        userCount = uc || 0;
      }
      
      if (!error && data) {
        const todayStr = new Date().toISOString().split('T')[0];
        const today = data.filter(d => d.created_at.startsWith(todayStr)).length;
        const high = data.filter(d => d.severity === 'high').length;
        
        // Grouping
        const by_class = data.reduce((acc, curr) => {
          acc[curr.class_name] = (acc[curr.class_name] || 0) + 1;
          return acc;
        }, {});

        const by_severity = data.reduce((acc, curr) => {
          acc[curr.severity] = (acc[curr.severity] || 0) + 1;
          return acc;
        }, {});
        
        setStats({ total: count || 0, today, high_severity: high, total_users: userCount, by_class, by_severity });
      }
      setLoading(false);
    };
    
    fetchStats();
  }, [profile, user]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {profile?.role === 'admin' ? 'Admin Overview Dashboard' : 'RoadGuard AI'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            {user 
              ? `Xin chào, ${profile?.username} (${profile?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'})` 
              : 'Hệ thống nhận diện và báo cáo hư hỏng mặt đường thông minh.'}
          </p>
        </div>
      </header>

      {/* CTA Button for members/public */}
      {(!user || profile?.role === 'member') && (
        <div style={{ marginBottom: '32px' }}>
          <Link to={user ? "/scan" : "/auth"} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
            <Activity size={24} /> {user ? 'BẮT ĐẦU QUÉT ĐƯỜNG' : 'ĐĂNG NHẬP ĐỂ ĐÓNG GÓP'}
          </Link>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Đang tải thống kê...</div>
      ) : (
        <div>
          {/* TOP CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <CheckCircle color="var(--accent-primary)" />
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Tổng đối tượng</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total}</div>
            </div>
            
            <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Activity color="var(--warning)" />
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Phát hiện hôm nay</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.today}</div>
            </div>

            <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <ShieldAlert color="var(--danger)" />
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Mức độ nghiêm trọng</span>
              </div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--danger)' }}>{stats.high_severity}</div>
            </div>

            {profile?.role === 'admin' && (
              <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Users color="var(--success)" />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Tổng thành viên</span>
                </div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.total_users}</div>
              </div>
            )}
          </div>

          {/* ADMIN EXTRA STATS */}
          {profile?.role === 'admin' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Phân loại theo lỗi */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <TrendingUp size={20} color="var(--accent-primary)" /> Phân bổ theo loại hư hỏng
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {Object.entries(stats.by_class).sort((a,b) => b[1] - a[1]).map(([className, count]) => {
                    const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={className}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{className}</span>
                          <span style={{ fontWeight: 'bold' }}>{count} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(stats.by_class).length === 0 && <span style={{ color: 'var(--text-secondary)' }}>Chưa có dữ liệu</span>}
                </div>
              </div>

              {/* Phân loại theo mức độ */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <AlertTriangle size={20} color="var(--warning)" /> Tỷ lệ mức độ nghiêm trọng
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['high', 'medium', 'low', 'unknown'].map(sev => {
                    const count = stats.by_severity[sev] || 0;
                    if (count === 0 && sev === 'unknown') return null;
                    const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    const color = sev === 'high' ? 'var(--danger)' : sev === 'medium' ? 'var(--warning)' : sev === 'low' ? 'var(--success)' : 'var(--text-secondary)';
                    const label = sev === 'high' ? 'Nghiêm trọng' : sev === 'medium' ? 'Trung bình' : sev === 'low' ? 'Nhẹ' : 'Chưa phân loại';
                    
                    return (
                      <div key={sev}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                          <span style={{ fontWeight: 'bold' }}>{count} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(stats.by_severity).length === 0 && <span style={{ color: 'var(--text-secondary)' }}>Chưa có dữ liệu</span>}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
