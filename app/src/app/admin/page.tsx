'use client';
import { useState } from 'react';
import { Bell, ShieldCheck, Shield, Star, Send, Check, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';

export default function AdminPage() {
  const { role, notifications, addNotification, markNotificationRead, isPro, setRole, updateSettings } = useAppStore();
  const { toast } = useToast();
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  if (role !== 'admin') return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem', color: 'var(--text-muted)' }}>
      <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Admin Access Only</h2>
      <p>Switch role to Admin to access this panel.</p>
    </div>
  );

  const sendNotification = () => {
    if (!notifTitle.trim()) return toast('Title required', 'error');
    addNotification({ userId: 'user', title: notifTitle, message: notifMsg, read: false });
    setNotifTitle(''); setNotifMsg('');
    toast('Notification sent!', 'success');
  };

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <ShieldCheck size={28} style={{ color: '#fbbf24' }} />
        <h1 className="section-title"><span style={{ color: '#fbbf24' }}>Admin Panel</span></h1>
      </div>

      {/* User management (demo) */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} /> Member Management
        </h2>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>User</span><span>Role</span><span>Status</span><span>Actions</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '0.9rem 1rem', alignItems: 'center', fontSize: '0.875rem' }}>
            <span style={{ fontWeight: 600 }}>Artist (You)</span>
            <span><span className="badge badge-purple">user</span></span>
            <span><span className={`badge ${isPro ? 'badge-green' : 'badge-gray'}`}>{isPro ? '⭐ Pro' : 'Free'}</span></span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className={`btn btn-sm ${isPro ? 'btn-danger' : 'btn-success'}`}
                onClick={() => { updateSettings({}); toast(isPro ? 'Pro revoked' : 'Pro granted!', 'success'); }}>
                <Star size={12} /> {isPro ? 'Revoke Pro' : 'Grant Pro'}
              </button>
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          In the full version, this table would list all registered users from the database with permission controls per user.
        </p>
      </div>

      {/* Send Notification */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} /> Send Notification
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="e.g. Your Pro subscription is active!" />
          </div>
          <div className="form-group">
            <label className="label">Message</label>
            <textarea className="textarea" value={notifMsg} onChange={(e) => setNotifMsg(e.target.value)} placeholder="Message body..." style={{ minHeight: 72 }} />
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={sendNotification}>
            <Send size={14} /> Send Notification
          </button>
        </div>
      </div>

      {/* Notification Log */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>
          Notification Log {unread > 0 && <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>{unread} unread</span>}
        </h2>
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications sent yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notifications.map((n) => (
              <div key={n.id} style={{
                padding: '0.75rem 1rem', borderRadius: 8,
                background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(168,85,247,0.08)',
                border: `1px solid ${n.read ? 'var(--border)' : 'rgba(168,85,247,0.25)'}`,
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{n.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{n.message}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.25rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markNotificationRead(n.id)}>
                    <Check size={12} /> Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role Switcher Info */}
      <div className="glass" style={{ padding: '1.25rem', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>
          💡 <strong>Demo mode:</strong> Use the role badge in the top bar to switch between Guest / User / Admin views and experience each permission level.
        </p>
      </div>
    </div>
  );
}
