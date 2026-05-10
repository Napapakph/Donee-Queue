'use client';
import { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Eye, EyeOff, Image, BookOpen } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ImageCropperModal } from '@/components/ImageCropperModal';
import { parseExample, type WorkType, type ScaleType, type CommissionStatus } from '@/lib/types';
import { uploadBase64Image } from '@/lib/upload';
import { applyWatermark } from '@/lib/watermark';
import PricingView from '@/components/pricing/PricingView';

type Tab = 'gallery' | 'pricing' | 'tos';

export default function CommissionPage({ externalData }: { externalData?: any }) {
  const storeData = useAppStore();
  const data = externalData || storeData;
  const {
    role, workTypes, addWorkType, updateWorkType, removeWorkType,
    addScaleType, updateScaleType, removeScaleType,
    commissionStatus, setCommissionStatus, tos, setTos,
    showcaseImages, addShowcaseImage, updateShowcaseImage, removeShowcaseImage, settings,
  } = data;
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('gallery');
  const isUser = role === 'user' || role === 'admin';
  const supabase = createClient();
  const [lightboxData, setLightboxData] = useState<{ images: string[], index: number } | null>(null);
  const [cropModalData, setCropModalData] = useState<{ src: string, aspectRatio?: number, onDone: (res: { full: string, thumb: string }) => void } | null>(null);
  const [editingImgId, setEditingImgId] = useState<string | null>(null);
  const [editingImgCaption, setEditingImgCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Image upload ───────────────────────────────────────────────────────────
  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('ขนาดรูปภาพใหญ่เกินไป (สูงสุด 5MB)', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropModalData({
        src: ev.target?.result as string,
        onDone: async (res) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return toast('Not logged in', 'error');
            
            toast('Processing watermark...', 'info');
            const watermarked = await applyWatermark(res.full, settings);
            
            toast('Uploading image to cloud storage...', 'info');
            const url = await uploadBase64Image(watermarked, user.id, 'gallery');

            const { data, error } = await supabase.from('showcase_images').insert({
              user_id: user.id, url, caption: file.name, is_nsfw: false
            }).select('id').single();
            if (data) {
              addShowcaseImage({ id: data.id, url, caption: file.name, isNSFW: false });
              toast('Image added to gallery', 'success');
            } else if (error) {
              toast(`DB Error: ${error.message}`, 'error');
            }
          } catch (err: any) {
            toast(`Upload failed: ${err.message}`, 'error');
          }
          setCropModalData(null);
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const statusColors: Record<CommissionStatus, string> = {
    open: 'var(--success)', closed: 'var(--danger)', waitlist: 'var(--warning)',
  };
  const statusLabels: Record<CommissionStatus, string> = {
    open: '✦ Commissions Open', closed: '✦ Commissions Closed', waitlist: '✦ Waitlist Only',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
            <span className="gradient-text">Commission Art</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Showcase, pricing & commission info</p>
        </div>

        {/* Status Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            padding: '0.5rem 1.2rem', borderRadius: 999,
            background: `${statusColors[commissionStatus as CommissionStatus] || statusColors.open}22`,
            border: `1px solid ${statusColors[commissionStatus as CommissionStatus] || statusColors.open}55`,
            color: statusColors[commissionStatus as CommissionStatus] || statusColors.open,
            fontWeight: 700, fontSize: '0.875rem',
          }}>
            {statusLabels[commissionStatus as CommissionStatus] || statusLabels.open}
          </div>
          {isUser && (
            <select className="select" style={{ width: 'auto', fontSize: '0.8rem' }}
              value={commissionStatus}
              onChange={async (e) => {
                const val = e.target.value as CommissionStatus;
                setCommissionStatus(val);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { error } = await supabase.from('profiles').update({ commission_status: val }).eq('id', user.id);
                  if (error) toast(`Status update failed: ${error.message}`, 'error');
                }
              }}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="waitlist">Waitlist</option>
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: '2rem', maxWidth: 400 }}>
        {([['gallery', 'Gallery'], ['pricing', 'Pricing'], ['tos', 'TOS']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {/* ── Gallery Tab ─────────────────────────────────────────────── */}
      {tab === 'gallery' && (
        <div>
          {isUser && (
            <div style={{ marginBottom: '1.5rem' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgUpload} />
              <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Upload Image
              </button>
            </div>
          )}

          {showcaseImages.length === 0 ? (
            <EmptyState icon={<Image size={48} />} title="No Artwork Yet" desc="Upload some examples to showcase your style." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
              {showcaseImages.map((img: any) => (
                <div key={img.id} className="glass" style={{ overflow: 'hidden', position: 'relative' }}>
                  <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={img.url} alt={img.caption}
                      className={img.isNSFW && role === 'guest' ? 'nsfw-blur' : ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setLightboxData({ images: showcaseImages.map((i: any) => i.url), index: showcaseImages.findIndex((i: any) => i.id === img.id) })}
                    />
                    {img.isNSFW && <span className="badge badge-red" style={{ position: 'absolute', top: 8, right: 8 }}>NSFW</span>}
                  </div>
                  <div style={{ padding: '0.75rem' }}>
                    {editingImgId === img.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input
                          className="input input-sm"
                          value={editingImgCaption}
                          onChange={(e) => setEditingImgCaption(e.target.value)}
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const { error } = await supabase.from('showcase_images').update({ caption: editingImgCaption }).eq('id', img.id);
                              if (!error) {
                                updateShowcaseImage(img.id, { caption: editingImgCaption });
                                setEditingImgId(null);
                              }
                            }
                          }}
                        />
                        <button className="btn btn-primary btn-sm" style={{ padding: '0 0.4rem' }} onClick={async () => {
                          const { error } = await supabase.from('showcase_images').update({ caption: editingImgCaption }).eq('id', img.id);
                          if (!error) {
                            updateShowcaseImage(img.id, { caption: editingImgCaption });
                            setEditingImgId(null);
                          }
                        }}><Check size={12} /></button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {img.caption}
                        </p>
                        {isUser && (
                          <button className="btn-icon" onClick={() => { setEditingImgId(img.id); setEditingImgCaption(img.caption); }}>
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <button onClick={async () => {
                      await supabase.from('showcase_images').delete().eq('id', img.id);
                      removeShowcaseImage(img.id);
                    }} className="btn-icon"
                      style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', border: 'none' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Pricing Tab ─────────────────────────────────────────────── */}
      {tab === 'pricing' && <PricingView />}

      {/* ── TOS Tab ──────────────────────────────────────────────────── */}
      {tab === 'tos' && (
        <div className="glass" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} /> Terms of Service
            </h2>
          </div>
          {isUser ? (
            <textarea className="textarea" value={tos} onChange={(e) => setTos(e.target.value)}
              style={{ minHeight: 320, fontFamily: 'inherit', fontSize: '0.9rem' }} />
          ) : (
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
              {tos}
            </div>
          )}
          {isUser && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { error } = await supabase.from('profiles').update({ tos }).eq('id', user.id);
                  if (error) {
                    toast(`TOS save failed: ${error.message}`, 'error');
                  } else {
                    toast('TOS saved to Database', 'success');
                  }
                }
              }}>
              <Check size={14} /> Save TOS
            </button>
          )}
        </div>
      )}
      
      {lightboxData && (
        <ImageLightbox 
          images={lightboxData.images} 
          initialIndex={lightboxData.index} 
          settings={settings}
          onClose={() => setLightboxData(null)} 
        />
      )}

      {cropModalData && (
        <ImageCropperModal
          imageSrc={cropModalData.src}
          aspectRatio={cropModalData.aspectRatio}
          onCropDone={cropModalData.onDone}
          onCancel={() => setCropModalData(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
      <div style={{ marginBottom: '1rem', opacity: 0.4 }}>{icon}</div>
      <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem' }}>{desc}</p>
    </div>
  );
}
