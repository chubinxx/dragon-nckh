import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function History() {
  const [detections, setDetections] = useState([]);
  const { profile, user } = useAuth();

  useEffect(() => {
    if (!profile) return;
    const fetchDetections = async () => {
      let query = supabase.from('detections')
        .select('*, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (profile.role === 'member') {
        query = query.eq('user_id', user.id);
      }
      
      const { data } = await query;
      if (data) setDetections(data);
    };
    fetchDetections();
  }, [profile, user]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Lịch sử phát hiện</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {detections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chưa có dữ liệu</div>
        ) : (
          detections.map(det => (
            <div key={det.id} className="glass-card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'center' }}>
              {det.image_url ? (
                <img src={det.image_url} alt={det.class_name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  🕳️
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>{det.class_name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                  <span>Tin cậy: {Math.round(det.confidence * 100)}%</span>
                  <span>{new Date(det.created_at).toLocaleDateString('vi-VN')}</span>
                  {profile?.role === 'admin' && (
                    <span style={{ color: 'var(--accent-light)' }}>Bởi: {det.profiles?.email?.split('@roadguard')[0]}</span>
                  )}
                </div>
              </div>
              
              <div>
                <span style={{ 
                  padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                  background: det.severity === 'high' ? 'var(--danger)' : det.severity === 'medium' ? 'var(--warning)' : 'var(--success)'
                }}>
                  {det.severity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
