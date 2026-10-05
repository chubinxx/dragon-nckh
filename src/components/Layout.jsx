import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scan, Map as MapIcon, History, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div>
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15,15,35,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-color)', display: 'flex',
        justifyContent: 'space-around', padding: '10px'
      }}>
        <NavLink to="/" style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
          fontSize: '12px'
        })}>
          <LayoutDashboard size={20} />
          <span>Tổng quan</span>
        </NavLink>
        
        <NavLink to={user ? "/scan" : "/auth"} style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
          fontSize: '12px'
        })}>
          <Scan size={20} />
          <span>Quét đường</span>
        </NavLink>

        <NavLink to="/map" style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
          fontSize: '12px'
        })}>
          <MapIcon size={20} />
          <span>Bản đồ</span>
        </NavLink>

        <NavLink to="/history" style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
          fontSize: '12px'
        })}>
          <History size={20} />
          <span>Lịch sử</span>
        </NavLink>

        {user ? (
          <button onClick={handleLogout} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: 'var(--danger)', fontSize: '12px'
          }}>
            <LogOut size={20} />
            <span>Thoát</span>
          </button>
        ) : (
          <NavLink to="/auth" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: 'var(--success)', fontSize: '12px'
          }}>
            <LogIn size={20} />
            <span>Đăng nhập</span>
          </NavLink>
        )}
      </nav>
      
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
