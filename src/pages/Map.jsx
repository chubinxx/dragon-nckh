import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function MapPage() {
  const [detections, setDetections] = useState([]);
  const { profile, user } = useAuth();

  useEffect(() => {
    if (!profile) return;
    const fetchDetections = async () => {
      let query = supabase.from('detections').select('*, profiles(email)');
      
      // If member, only show their own detections
      if (profile.role === 'member') {
        query = query.eq('user_id', user.id);
      }
      
      const { data } = await query;
      if (data) setDetections(data);
    };
    fetchDetections();
  }, [profile, user]);

  const createIcon = (className) => {
    return L.divIcon({
      html: `<div class="custom-marker">${className === 'O_ga' ? '🕳️' : '⚠️'}</div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer 
        center={[21.0285, 105.8542]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {detections.map(det => (
          det.latitude && det.longitude ? (
            <Marker 
              key={det.id} 
              position={[det.latitude, det.longitude]}
              icon={createIcon(det.class_name)}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  {det.image_url && <img src={det.image_url} alt="Damage" style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }} />}
                  <h4 style={{ marginBottom: '4px' }}>{det.class_name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Độ tin cậy: {Math.round(det.confidence * 100)}%</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Mức độ: {det.severity}</p>
                  {profile.role === 'admin' && (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent-light)' }}>Người phát hiện: {det.profiles?.email}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
