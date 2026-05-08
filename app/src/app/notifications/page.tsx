'use client';
import { Bell, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useAppStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Bell size={22} style={{ color: 'var(--accent)' }} />
        <h1 className="section-title"><span className="gradient-text">Notifications</span></h1>
        {unread > 0 && <span className="badge badge-red">{unread} new</span>}
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
          <Bell size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div key={n.id} className="glass" style={{
              padding: '1rem 1.25rem',
              borderColor: n.read ? 'var(--border)' : 'rgba(168,85,247,0.3)',
              background: n.read ? 'var(--bg-card)' : 'rgba(168,85,247,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{n.title}</div>
                  {n.message && <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{n.message}</div>}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markNotificationRead(n.id)}>
                    <Check size={13} /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
