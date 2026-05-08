'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Palette, LayoutDashboard, BarChart3, Settings, User,
  Bell, ShieldCheck, Menu, X, ChevronDown, LogIn, LogOut, Star
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/AuthProvider';

const navLinks = [
  { href: '/commission', label: 'Commission Art', icon: Palette },
  { href: '/queue', label: 'Queue', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, userOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings, userOnly: true },
];

export function TopBar() {
  const pathname = usePathname();
  const { role, setRole, profile, notifications } = useAppStore();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isUser = role === 'user' || role === 'admin';
  const unread = notifications.filter((n) => !n.read).length;
  const visibleLinks = navLinks.filter((l) => !l.userOnly || isUser);

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
        background: 'rgba(13,13,20,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        height: '60px',
        display: 'flex', alignItems: 'center',
      }}>
        <nav style={{
          width: '100%', maxWidth: '1400px', margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}
              className="gradient-text">
              {profile.displayName || 'Donee Queue'}
            </span>
          </Link>

          {/* Desktop Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}
            className="desktop-nav">
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: active ? 'rgba(168,85,247,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(168,85,247,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
            {role === 'admin' && (
              <Link href="/admin" style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.9rem', borderRadius: 8,
                fontSize: '0.875rem', fontWeight: 500,
                color: '#fbbf24', textDecoration: 'none',
                background: pathname === '/admin' ? 'rgba(251,191,36,0.1)' : 'transparent',
                border: '1px solid transparent',
              }}>
                <ShieldCheck size={15} /> Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Login button (guest) */}
            {!user && (
              <Link href="/auth/login" className="btn btn-primary btn-sm" style={{ gap: '0.4rem', textDecoration: 'none' }}>
                <LogIn size={13} /> Log In
              </Link>
            )}

            {/* Notifications */}
            {isUser && (
              <Link href="/notifications" style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
              }}>
                <Bell size={16} />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 8, height: 8,
                    background: 'var(--danger)',
                    borderRadius: '50%',
                  }} />
                )}
              </Link>
            )}

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(!profileOpen)} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.3rem 0.6rem',
                cursor: 'pointer', color: 'var(--text-primary)',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#a855f7,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {(profile.displayName || 'U')[0].toUpperCase()}
                  </div>
                )}
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  background: '#160d28',
                  border: '1px solid rgba(168,85,247,0.2)',
                  borderRadius: 10,
                  minWidth: 180,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  animation: 'slideDown 0.18s ease',
                  zIndex: 999,
                }}>
                  <Link href="/profile" onClick={() => setProfileOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.7rem 1rem',
                    color: 'var(--text-primary)', textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168,85,247,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={14} /> My Profile
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)' }} />
                  {user && (
                    <button onClick={() => { signOut(); setProfileOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.7rem 1rem', width: '100%',
                      color: '#f87171', background: 'none',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: '0.875rem', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="btn-icon mobile-menu-btn"
              style={{ display: 'none' }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 499,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }} onClick={() => setMobileOpen(false)}>
          <nav onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 260,
            background: '#0d0d14',
            borderRight: '1px solid var(--border)',
            padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
            animation: 'slideDown 0.22s ease',
          }}>
            <div style={{ padding: '0.5rem 0 1rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
              <span className="gradient-text" style={{ fontWeight: 800 }}>{profile.displayName}</span>
            </div>
            {visibleLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.7rem 0.8rem', borderRadius: 8,
                color: pathname.startsWith(href) ? 'var(--accent)' : 'var(--text-secondary)',
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
                background: pathname.startsWith(href) ? 'rgba(168,85,247,0.1)' : 'transparent',
              }}>
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
