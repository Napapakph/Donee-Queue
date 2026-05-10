'use client';
import { useState } from 'react';
import { Check, Plus, Trash2, ExternalLink, Eye, EyeOff, Upload } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { SocialPlatform, ContactChannel, UserProfile } from '@/lib/types';
import { ImageCropperModal } from '@/components/ImageCropperModal';
import { uploadBase64Image } from '@/lib/upload';

const SOCIAL_OPTIONS: { value: SocialPlatform; label: string; icon: string }[] = [
  { value: 'vgen', label: 'VGen', icon: '🎨' },
  { value: 'gumroad', label: 'Gumroad', icon: '🛍️' },
  { value: 'kofi', label: 'Ko-fi', icon: '☕' },
  { value: 'patreon', label: 'Patreon', icon: '🎭' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'deviantart', label: 'DeviantArt', icon: '🌀' },
  { value: 'x', label: 'X (Twitter)', icon: '✖️' },
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'bluesky', label: 'Bluesky', icon: '🦋' },
  { value: 'pixiv', label: 'Pixiv', icon: '🖼️' },
  { value: 'artstation', label: 'ArtStation', icon: '🎭' },
  { value: 'discord', label: 'Discord', icon: '💬' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'twitch', label: 'Twitch', icon: '🟣' },
  { value: 'custom', label: 'Custom', icon: '🔗' },
];

export default function ProfilePage() {
  const { profile, updateProfile, addContactChannel, updateContactChannel, removeContactChannel, role } = useAppStore();
  const { toast } = useToast();
  const isUser = role === 'user' || role === 'admin';

  const [name, setName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newCh, setNewCh] = useState<Omit<ContactChannel, 'id'>>({ platform: 'x', url: '', visible: true });
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const supabase = createClient();

  const syncToDB = async (updates: Partial<UserProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const latest = useAppStore.getState().profile;
    await supabase.from('profiles').update({
      display_name: latest.displayName,
      bio: latest.bio,
      avatar: latest.avatar,
      contact_channels: latest.contactChannels,
    }).eq('id', user.id);
  };

  const handleSaveProfile = async () => {
    updateProfile({ displayName: name, bio });
    await syncToDB({});
    toast('Profile saved!', 'success');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageToCrop(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = '';
  };

  const handleCropDone = async (res: { thumb: string }) => {
    setImageToCrop(null);
    toast('Uploading avatar...', 'info');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const url = await uploadBase64Image(res.thumb, user.id, 'avatars');
      updateProfile({ avatar: url });
      await syncToDB({ avatar: url });
      toast('Avatar updated!', 'success');
    } catch (err: any) {
      toast(`Upload failed: ${err.message}`, 'error');
    }
  };

  const handleAddChannel = async () => {
    if (!newCh.url.trim()) return toast('URL required', 'error');
    addContactChannel(newCh);
    await syncToDB({});
    setNewCh({ platform: 'x', url: '', visible: true });
    setShowAddChannel(false);
    toast('Channel added!', 'success');
  };

  // For guest view – only show visible channels
  const visibleChannels = isUser
    ? profile.contactChannels
    : profile.contactChannels.filter((c) => c.visible);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 className="section-title" style={{ marginBottom: '2rem' }}>
        <span className="gradient-text">Profile</span>
      </h1>

      {/* Avatar + Name */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)', marginBottom: '0.75rem' }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '0.75rem' }}>✦</div>
          )}
          {isUser && (
            <>
              <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              <label htmlFor="avatar-upload" className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={13} /> Change
              </label>
            </>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="label">Display Name</label>
            {isUser ? (
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{profile.displayName}</p>
            )}
          </div>
          <div className="form-group">
            <label className="label">About Me</label>
            {isUser ? (
              <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} style={{ minHeight: 80 }} />
            ) : (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{profile.bio}</p>
            )}
          </div>
          {isUser && (
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={handleSaveProfile}>
              <Check size={14} /> Save Profile
            </button>
          )}
        </div>
      </div>

      {/* Contact Channels */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700 }}>Contact Channels</h2>
          {isUser && <button className="btn btn-primary btn-sm" onClick={() => setShowAddChannel(true)}><Plus size={14} /> Add Channel</button>}
        </div>

        {showAddChannel && isUser && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto', gap: '0.6rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 8, alignItems: 'end' }}>
            <div className="form-group">
              <label className="label">Platform</label>
              <select className="select" value={newCh.platform} onChange={(e) => setNewCh({ ...newCh, platform: e.target.value as SocialPlatform })}>
                {SOCIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">URL</label>
              <input className="input" placeholder="https://..." value={newCh.url} onChange={(e) => setNewCh({ ...newCh, url: e.target.value })} />
            </div>
            <label className="toggle-wrap" style={{ paddingBottom: '0.1rem' }}>
              <span className="toggle"><input type="checkbox" checked={newCh.visible} onChange={(e) => setNewCh({ ...newCh, visible: e.target.checked })} /><span className="toggle-slider" /></span>
              <span style={{ fontSize: '0.75rem' }}>Public</span>
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-primary btn-sm" onClick={handleAddChannel}><Check size={13} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddChannel(false)}>✕</button>
            </div>
          </div>
        )}

        {visibleChannels.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No contact channels added yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {visibleChannels.map((ch) => {
              const opt = SOCIAL_OPTIONS.find((o) => o.value === ch.platform);
              return (
                <div key={ch.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.9rem', borderRadius: 99,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}>
                  <span>{opt?.icon}</span>
                  <a href={ch.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {ch.label || opt?.label}
                    <ExternalLink size={10} />
                  </a>
                  {isUser && (
                    <>
                      <button className="btn-icon" style={{ padding: '0.2rem', border: 'none' }}
                        onClick={async () => {
                          updateContactChannel(ch.id, { visible: !ch.visible });
                          await syncToDB({});
                        }}>
                        {ch.visible ? <Eye size={11} /> : <EyeOff size={11} style={{ color: 'var(--text-muted)' }} />}
                      </button>
                      <button className="btn-icon" style={{ padding: '0.2rem', border: 'none', color: 'var(--danger)' }}
                        onClick={async () => {
                          removeContactChannel(ch.id);
                          await syncToDB({});
                        }}>
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Cropper Modal */}
      {imageToCrop && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          aspectRatio={1}
          onCancel={() => setImageToCrop(null)}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
}
