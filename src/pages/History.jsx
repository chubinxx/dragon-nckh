import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Filter, RefreshCw, CheckSquare, Square, Calendar, Loader2 } from 'lucide-react';

export default function History() {
  const [detections, setDetections] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const { profile } = useAuth();
  
  // Filters
  const [filterClass, setFilterClass] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Re-evaluation
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const hfUrl = localStorage.getItem('hf_api_url') || 'https://YOUR-HF-SPACE.hf.space';

  const fetchDetections = async () => {
    let query = supabase.from('detections')
      .select('*, custom_users(username)')
      .order('created_at', { ascending: false });
      
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', profile?.id);
    }
    
    const { data } = await query;
    if (data) {
      setDetections(data);
      applyFilters(data, filterClass, filterSeverity, dateRange);
    }
  };

  useEffect(() => {
    if (profile) fetchDetections();
  }, [profile]);

  const applyFilters = (data, fClass, fSev, fDate) => {
    let result = [...data];
    if (fClass !== 'all') result = result.filter(d => d.class_name === fClass);
    if (fSev !== 'all') result = result.filter(d => d.severity === fSev);
    if (fDate.start) result = result.filter(d => d.created_at >= fDate.start);
    if (fDate.end) {
      const endDate = new Date(fDate.end);
      endDate.setHours(23, 59, 59);
      result = result.filter(d => new Date(d.created_at) <= endDate);
    }
    setFilteredData(result);
  };

  useEffect(() => {
    applyFilters(detections, filterClass, filterSeverity, dateRange);
  }, [filterClass, filterSeverity, dateRange, detections]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([]);
    else setSelectedIds(filteredData.map(d => d.id));
  };

  const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob); 
      reader.onloadend = () => resolve(reader.result);
    });
  };

  const handleReevaluate = async () => {
    if (selectedIds.length === 0) return alert("Vui lòng chọn ít nhất 1 ảnh!");
    if (!window.confirm(`Bạn có chắc muốn nhận diện lại ${selectedIds.length} ảnh đã chọn?`)) return;

    setIsReevaluating(true);
    setProgress({ current: 0, total: selectedIds.length });

    const selectedDetections = detections.filter(d => selectedIds.includes(d.id) && d.image_url);

    let currentCount = 0;
    for (let det of selectedDetections) {
      try {
        const base64Str = await getBase64FromUrl(det.image_url);
        
        const response = await fetch(`${hfUrl}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: [base64Str] })
        });
        
        const result = await response.json();
        const aiData = typeof result.data[0] === 'string' ? JSON.parse(result.data[0]) : result.data[0];
        
        if (aiData && aiData.count > 0) {
          // Lấy lỗi nghiêm trọng nhất hoặc tự tin nhất
          const bestDet = aiData.detections.reduce((prev, current) => 
            (prev.confidence > current.confidence) ? prev : current
          );

          await supabase.from('detections').update({
            class_name: bestDet.class_name,
            confidence: bestDet.confidence,
            severity: bestDet.severity || 'low'
          }).eq('id', det.id);
        }
      } catch (err) {
        console.error("Lỗi nhận diện ID:", det.id, err);
      }
      currentCount++;
      setProgress({ current: currentCount, total: selectedIds.length });
    }

    setIsReevaluating(false);
    setSelectedIds([]);
    alert("Đã hoàn tất nhận diện lại!");
    fetchDetections();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
          Lịch sử phát hiện {profile?.role === 'admin' ? '(Toàn hệ thống)' : ''}
        </h1>
        
        {profile?.role === 'admin' && (
          <button 
            onClick={handleReevaluate}
            disabled={isReevaluating || selectedIds.length === 0}
            className="btn btn-primary"
            style={{ background: isReevaluating ? 'var(--bg-secondary)' : 'var(--accent-gradient)' }}
          >
            {isReevaluating ? <Loader2 className="spin" size={20} /> : <RefreshCw size={20} />}
            {isReevaluating ? `Đang xử lý ${progress.current}/${progress.total}...` : `Nhận diện lại (${selectedIds.length})`}
          </button>
        )}
      </div>
      
      {/* Filters (Only for Admin to keep member view simple, or both) */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loại hư hỏng</label>
          <select className="input-field" value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '8px', marginTop: '4px' }}>
            <option value="all">Tất cả</option>
            <option value="O_ga">Ổ gà</option>
            <option value="Nut_Doc">Nứt dọc</option>
            <option value="Nut_Mang">Nứt mảng</option>
            <option value="Loi">Lồi</option>
            <option value="Nut_Ngang">Nứt ngang</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mức độ</label>
          <select className="input-field" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ padding: '8px', marginTop: '4px' }}>
            <option value="all">Tất cả</option>
            <option value="high">Nghiêm trọng (High)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="low">Nhẹ (Low)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Từ ngày</label>
          <input type="date" className="input-field" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ padding: '8px', marginTop: '4px' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đến ngày</label>
          <input type="date" className="input-field" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ padding: '8px', marginTop: '4px' }} />
        </div>
        <button className="btn" onClick={() => {setFilterClass('all'); setFilterSeverity('all'); setDateRange({start:'', end:''})}} style={{ border: '1px solid var(--border-color)' }}>
          Xóa bộ lọc
        </button>
      </div>
      
      {/* Table/List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {profile?.role === 'admin' && filteredData.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
            <button onClick={toggleSelectAll} style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedIds.length === filteredData.length && filteredData.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}
              <span>Chọn tất cả</span>
            </button>
          </div>
        )}

        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Không có dữ liệu phù hợp</div>
        ) : (
          filteredData.map(det => (
            <div key={det.id} className="glass-card" style={{ display: 'flex', gap: '16px', padding: '16px', alignItems: 'center', border: selectedIds.includes(det.id) ? '1px solid var(--accent-primary)' : '' }}>
              
              {profile?.role === 'admin' && (
                <button onClick={() => toggleSelect(det.id)} style={{ color: selectedIds.includes(det.id) ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  {selectedIds.includes(det.id) ? <CheckSquare size={24} /> : <Square size={24} />}
                </button>
              )}

              {det.image_url ? (
                <img src={det.image_url} alt={det.class_name} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  🕳️
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{det.class_name}</h4>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Tin cậy: {Math.round(det.confidence * 100)}% | Mức độ: <span style={{ color: det.severity === 'high' ? 'var(--danger)' : det.severity === 'medium' ? 'var(--warning)' : 'var(--success)'}}>{det.severity}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(det.created_at).toLocaleString('vi-VN')}</span>
                  {profile?.role === 'admin' && (
                    <span style={{ color: 'var(--accent-light)' }}>Bởi: {det.custom_users?.username || 'Unknown'}</span>
                  )}
                </div>
              </div>
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}
