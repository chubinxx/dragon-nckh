import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scan, Map as MapIcon, History, LogOut, LogIn, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div>
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="glass"
        style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 100,
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-secondary)', opacity: 0.95, backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-color)', display: 'flex',
        justifyContent: 'space-around', padding: '10px'
      }}>
        <NavLink to="/" style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
          fontSize: '12px'
        })}>
          <LayoutDashboard size={20} />
          <span>Tổng quan</span>
        </NavLink>
        
        <NavLink to={user ? "/scan" : "/auth"} style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
          fontSize: '12px'
        })}>
          <Scan size={20} />
          <span>Quét đường</span>
        </NavLink>

        <NavLink to="/map" style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
          fontSize: '12px'
        })}>
          <MapIcon size={20} />
          <span>Bản đồ</span>
        </NavLink>

        <NavLink to="/history" style={({isActive}) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
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
