'use client';
import Link from 'next/link';
import { Palette, LayoutDashboard, BarChart3, Settings, ArrowRight, Star, Zap, Shield } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const { profile, queueCards, settings } = useAppStore();
  const totalActive = queueCards.filter((c) => c.progress !== 'Complete').length;
  const totalIncome = queueCards
    .filter((c) => c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.price * c.quantity, 0);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar" style={{
              width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
              border: '3px solid var(--accent)',
              boxShadow: '0 0 32px var(--accent-glow)',
              margin: '0 auto 1rem',
              display: 'block',
            }} />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg,#a855f7,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', margin: '0 auto 1rem',
              boxShadow: '0 0 32px var(--accent-glow)',
            }}>✦</div>
          )}
        </div>

        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
          <span className="gradient-text">{profile.displayName}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          {profile.bio}
        </p>

        {/* Contact Channels */}
        {profile.contactChannels?.filter(c => c.visible).length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {profile.contactChannels.filter(c => c.visible).map(ch => {
              const icons: Record<string, string> = {
                vgen: '🎨', gumroad: '🛍️', kofi: '☕', patreon: '🎭', facebook: '📘',
                deviantart: '🌀', x: '✖️', instagram: '📸', bluesky: '🦋', pixiv: '🖼️',
                artstation: '🎭', discord: '💬', email: '✉️', website: '🌐',
                youtube: '▶️', tiktok: '🎵', twitch: '🟣', custom: '🔗'
              };
              const icon = icons[ch.platform] || '🔗';
              return (
                <a key={ch.id} href={ch.url} target="_blank" rel="noopener noreferrer"
                  className="glass"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 0.8rem', borderRadius: 99,
                    color: 'var(--text-primary)', textDecoration: 'none',
                    fontSize: '0.9rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{icon}</span> {ch.label || ch.platform.charAt(0).toUpperCase() + ch.platform.slice(1)}
                </a>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/commission" className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <Palette size={16} /> View Commission Info
          </Link>
          <Link href="/queue" className="btn btn-ghost">
            <LayoutDashboard size={16} /> Queue Board
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {[
          { label: 'Active Commissions', value: totalActive, icon: <LayoutDashboard size={20} />, color: 'var(--accent)' },
          { label: 'Total Completed', value: queueCards.filter((c) => c.progress === 'Complete').length, icon: <Star size={20} />, color: 'var(--success)' },
          { label: 'Total Income', value: `${settings.currency}${totalIncome.toLocaleString()}`, icon: <Zap size={20} />, color: '#fbbf24' },
          { label: 'Clients Served', value: new Set(queueCards.map((c) => c.customerName)).size, icon: <Shield size={20} />, color: 'var(--secondary)' },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ color: s.color, marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
        {[
          {
            href: '/commission', icon: <Palette size={28} />, title: 'Commission Art',
            desc: 'Browse my artwork examples, pricing, and commission types.',
            color: '#a855f7',
          },
          {
            href: '/queue', icon: <LayoutDashboard size={28} />, title: 'Queue Board',
            desc: 'Track all active commissions with status, deadline, and progress.',
            color: '#6366f1',
          },
          {
            href: '/analytics', icon: <BarChart3 size={28} />, title: 'Analytics',
            desc: 'Income insights, best-sellers, and financial tracking.',
            color: '#22d3a5',
          },
          {
            href: '/settings', icon: <Settings size={28} />, title: 'Settings',
            desc: 'Customize colors, themes, effects, and preferences.',
            color: '#f59e0b',
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div className="glass" style={{ padding: '1.75rem', height: '100%', cursor: 'pointer' }}>
              <div style={{ color: item.color, marginBottom: '1rem' }}>{item.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '1rem', color: item.color, fontSize: '0.8rem', fontWeight: 600 }}>
                Go <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
