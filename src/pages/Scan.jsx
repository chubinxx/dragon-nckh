import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera as CameraIcon, StopCircle, RefreshCw } from 'lucide-react';

export default function Scan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState([]);
  const { user } = useAuth();
  
  const hfUrl = localStorage.getItem('hf_api_url') || 'https://YOUR-HF-SPACE.hf.space';

  useEffect(() => {
    // Check camera permission and start
    startCamera();
    return () => stopCamera();
  }, []);

  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      addLog("Lỗi camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  const getGPS = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    
    addLog("Đang phân tích...");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    
    // Draw centered crop
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - minDim) / 2;
    const sy = (video.videoHeight - minDim) / 2;
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 640, 640);
    
    const base64Image = canvas.toDataURL('image/webp', 0.8).replace(/^data:image\/\w+;base64,/, '');

    try {
      // 1. Gửi lên HF API
      const response = await fetch(`${hfUrl}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [`data:image/jpeg;base64,${base64Image}`] })
      });
      
      const result = await response.json();
      const detectionData = typeof result.data[0] === 'string' ? JSON.parse(result.data[0]) : result.data[0];
      
      if (detectionData.count > 0) {
        addLog(`Phát hiện ${detectionData.count} lỗi! Đang lưu...`);
        const gps = await getGPS();
        
        // 2. Lưu ảnh lên Supabase Storage
        canvas.toBlob(async (blob) => {
          const fileName = `pothole_${Date.now()}.webp`;
          const { data, error } = await supabase.storage.from('pothole-images').upload(`detections/${fileName}`, blob);
          
          if (!error) {
            const { data: urlData } = supabase.storage.from('pothole-images').getPublicUrl(`detections/${fileName}`);
            
            // 3. Lưu record vào DB kèm user_id
            for (let det of detectionData.detections) {
              await supabase.from('detections').insert([{
                class_name: det.class_name,
                confidence: det.confidence,
                latitude: gps?.lat || 0,
                longitude: gps?.lng || 0,
                image_url: urlData.publicUrl,
                severity: det.severity || 'low',
                user_id: user.id
              }]);
            }
            addLog("Đã lưu thành công!");
          }
        }, 'image/webp', 0.8);
      } else {
        addLog("Bình thường");
      }
    } catch (err) {
      addLog("Lỗi server: " + err.message);
    }

    if (scanning) {
      setTimeout(processFrame, 5000); // 5 seconds interval
    }
  };

  useEffect(() => {
    if (scanning) {
      processFrame();
    }
  }, [scanning]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Logs HUD */}
        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, pointerEvents: 'none' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px', fontSize: '14px', backdropFilter: 'blur(10px)' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ padding: '24px', paddingBottom: '90px', display: 'flex', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <button 
          onClick={() => setScanning(!scanning)}
          style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: scanning ? 'var(--danger)' : 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: scanning ? '0 0 20px rgba(255,107,107,0.5)' : '0 0 20px rgba(108,92,231,0.5)',
            color: 'white'
          }}
        >
          {scanning ? <StopCircle size={40} /> : <CameraIcon size={40} />}
        </button>
      </div>
    </div>
  );
}
