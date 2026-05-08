'use client';
import { useState } from 'react';
import { Check, Save } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ToastProvider';
import type { AppSettings } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';

const PRESET_THEMES = [
  { name: 'midnight-purple', label: 'Midnight Purple', accent: '#a855f7', secondary: '#6366f1', bg1: '#0d0d14', bg2: '#1a0a2e' },
  { name: 'rose-gold',       label: 'Rose Gold',       accent: '#f43f5e', secondary: '#fb923c', bg1: '#0f0a0b', bg2: '#1e0e10' },
  { name: 'ocean-blue',      label: 'Ocean Blue',      accent: '#3b82f6', secondary: '#06b6d4', bg1: '#050d1a', bg2: '#0a1628' },
  { name: 'forest-green',    label: 'Forest Green',    accent: '#22d3a5', secondary: '#16a34a', bg1: '#050f0a', bg2: '#0a1e0f' },
  { name: 'golden-sunset',   label: 'Golden Sunset',   accent: '#f59e0b', secondary: '#ef4444', bg1: '#100a00', bg2: '#1e1000' },
];
const PATTERNS = ['none', 'dots', 'grid', 'noise'] as const;

export default function SettingsPage() {
  const { role, settings, updateSettings } = useAppStore();
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClient();

  // Local draft copy — only applied when "Save & Apply" is clicked
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saving, setSaving] = useState(false);

  if (role === 'guest') return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem', color: 'var(--text-muted)' }}>
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Access Restricted</h2>
      <p>Please <a href="/auth/login" style={{ color: 'var(--accent)' }}>log in</a> to access settings.</p>
    </div>
  );

  const setD = (k: keyof AppSettings, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));

  const applyPreset = (p: typeof PRESET_THEMES[0]) => {
    setDraft((d) => ({
      ...d,
      presetTheme: p.name, accentColor: p.accent, secondaryColor: p.secondary,
      bgColor1: p.bg1, bgColor2: p.bg2, bgType: 'gradient',
    }));
  };

  const handleSaveApply = async () => {
    setSaving(true);
    // Apply to store (ThemeApplier will pick it up and update the DOM)
    updateSettings(draft);

    // Save to Supabase if logged in
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ app_settings: draft })
        .eq('id', user.id);
      if (error) toast('Saved locally (Supabase error)', 'warning');
      else toast('Settings saved & applied!', 'success');
    } else {
      toast('Settings applied! (Login to save to cloud)', 'info');
    }
    setSaving(false);
  };

  // Live preview swatch
  const previewStyle = {
    background: draft.bgType === 'gradient'
      ? `linear-gradient(${draft.bgGradientDirection}, ${draft.bgColor1}, ${draft.bgColor2})`
      : draft.bgColor1,
    border: `2px solid ${draft.accentColor}`,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Save button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="section-title"><span className="gradient-text">Settings</span></h1>
        <button className="btn btn-primary" onClick={handleSaveApply} disabled={saving}
          style={{ gap: '0.5rem' }}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save & Apply'}
        </button>
      </div>

      {/* Live Preview bar */}
      <div className="glass" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ width: 60, height: 36, borderRadius: 8, ...previewStyle }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview (draft — not applied yet)</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: draft.accentColor }}>
            {draft.accentColor} · {draft.bgType}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Click <strong style={{ color: 'var(--accent)' }}>Save & Apply</strong> to apply changes
        </div>
      </div>

      {/* Preset Themes */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Preset Themes</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {PRESET_THEMES.map((p) => (
            <button key={p.name} onClick={() => applyPreset(p)} style={{
              padding: '0.6rem 1.1rem', borderRadius: 999, cursor: 'pointer',
              background: `linear-gradient(135deg,${p.accent},${p.secondary})`,
              color: '#fff', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
              border: draft.presetTheme === p.name ? '2px solid #fff' : '2px solid transparent',
              boxShadow: draft.presetTheme === p.name ? '0 0 16px rgba(255,255,255,0.3)' : 'none',
              transition: 'all 0.2s',
            }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Custom Colors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
          {[
            { label: 'Accent Color', key: 'accentColor' as keyof AppSettings },
            { label: 'Secondary Color', key: 'secondaryColor' as keyof AppSettings },
            { label: 'Background Color 1', key: 'bgColor1' as keyof AppSettings },
            { label: 'Background Color 2', key: 'bgColor2' as keyof AppSettings },
          ].map(({ label, key }) => (
            <div key={key} className="form-group">
              <label className="label">{label}</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="color" value={draft[key] as string}
                  onChange={(e) => setD(key, e.target.value)}
                  style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none' }} />
                <input className="input" value={draft[key] as string}
                  onChange={(e) => setD(key, e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Background Type</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {(['solid', 'gradient', 'pattern', 'image'] as const).map((t) => (
            <button key={t} onClick={() => setD('bgType', t)}
              className={draft.bgType === t ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {draft.bgType === 'gradient' && (
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="label">Gradient Direction</label>
            <select className="select" value={draft.bgGradientDirection} onChange={(e) => setD('bgGradientDirection', e.target.value)}>
              {['135deg', '90deg', '45deg', '180deg', '0deg'].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        {draft.bgType === 'pattern' && (
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="label">Pattern</label>
            <select className="select" value={draft.bgPattern} onChange={(e) => setD('bgPattern', e.target.value as any)}>
              {PATTERNS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label className="label">Background Blur: {draft.bgBlur}px</label>
          <input type="range" min="0" max="20" value={draft.bgBlur} onChange={(e) => setD('bgBlur', +e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
      </div>

      {/* Effects */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Effects & Animations</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {[
            { key: 'particlesEnabled', label: 'Particle Background' },
            { key: 'pageTransitions', label: 'Page Transitions' },
            { key: 'cardHoverAnimations', label: 'Card Hover Animations' },
          ].map(({ key, label }) => (
            <label key={key} className="toggle-wrap">
              <span className="toggle">
                <input type="checkbox" checked={draft[key as keyof AppSettings] as boolean}
                  onChange={(e) => setD(key as keyof AppSettings, e.target.checked)} />
                <span className="toggle-slider" />
              </span>
              <span style={{ fontSize: '0.875rem' }}>{label}</span>
            </label>
          ))}
          <div className="form-group">
            <label className="label">Glassmorphism Intensity: {draft.glassmorphismIntensity}%</label>
            <input type="range" min="0" max="100" value={draft.glassmorphismIntensity}
              onChange={(e) => setD('glassmorphismIntensity', +e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Queue settings */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Queue & Deadline</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Deadline Warning Threshold: {draft.warningThresholdPercent}%</label>
            <input type="range" min="10" max="99" value={draft.warningThresholdPercent}
              onChange={(e) => setD('warningThresholdPercent', +e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Show orange warning when {draft.warningThresholdPercent}% of deadline duration has passed
            </p>
          </div>
          {[
            { key: 'defaultCardPublic', label: 'New cards are public by default' },
            { key: 'nsfwBlurForGuests', label: 'Blur NSFW content for guests' },
            { key: 'showIncomeSummaryToGuests', label: 'Show income summary to guests' },
          ].map(({ key, label }) => (
            <label key={key} className="toggle-wrap">
              <span className="toggle">
                <input type="checkbox" checked={draft[key as keyof AppSettings] as boolean}
                  onChange={(e) => setD(key as keyof AppSettings, e.target.checked)} />
                <span className="toggle-slider" />
              </span>
              <span style={{ fontSize: '0.875rem' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Locale */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Locale & Format</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Currency Symbol</label>
            <select className="select" value={draft.currency} onChange={(e) => setD('currency', e.target.value)}>
              {['฿', '$', '€', '¥', '£', '₩', '₹'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Date Format</label>
            <select className="select" value={draft.dateFormat} onChange={(e) => setD('dateFormat', e.target.value as any)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSaveApply} disabled={saving} style={{ gap: '0.5rem' }}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save & Apply All Settings'}
        </button>
      </div>
    </div>
  );
}
