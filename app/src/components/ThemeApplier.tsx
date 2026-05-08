'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function ThemeApplier() {
  const settings = useAppStore((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--secondary', settings.secondaryColor);

    // Derive glow from accent
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    };
    try {
      const rgb = hexToRgb(settings.accentColor);
      root.style.setProperty('--accent-glow', `rgba(${rgb},0.35)`);
    } catch {}

    // Apply background to body
    let bg = '';
    if (settings.bgType === 'solid') {
      bg = settings.bgColor1;
    } else if (settings.bgType === 'gradient') {
      bg = `linear-gradient(${settings.bgGradientDirection}, ${settings.bgColor1} 0%, ${settings.bgColor2} 100%)`;
    } else if (settings.bgType === 'image' && settings.bgImage) {
      bg = `url(${settings.bgImage}) center/cover no-repeat fixed`;
    } else {
      bg = `linear-gradient(135deg, ${settings.bgColor1} 0%, ${settings.bgColor2} 100%)`;
    }
    document.body.style.background = bg;
    document.body.style.backgroundAttachment = 'fixed';

    // Pattern overlay via pseudo — apply via a dedicated overlay div
    let overlay = document.getElementById('bg-pattern-overlay');
    if (settings.bgPattern !== 'none') {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'bg-pattern-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;';
        document.body.prepend(overlay);
      }
      const patterns: Record<string, string> = {
        dots: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        grid: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
        noise: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
      };
      overlay.style.background = patterns[settings.bgPattern] || '';
      overlay.style.backgroundSize = settings.bgPattern === 'dots' ? '24px 24px' : settings.bgPattern === 'grid' ? '40px 40px' : 'auto';
    } else if (overlay) {
      overlay.remove();
    }

    // Glassmorphism intensity
    const blur = Math.round((settings.glassmorphismIntensity / 100) * 24);
    root.style.setProperty('--glass-blur', `${blur}px`);

  }, [settings]);

  return null;
}
