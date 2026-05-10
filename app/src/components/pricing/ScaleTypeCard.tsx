'use client';
import { ScaleType, PricingExtra } from '@/lib/types';
import { Edit2, Trash2, Clock, Plus, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface ScaleTypeCardProps {
  workTypeId: string;
  scale: ScaleType;
  onEdit: () => void;
  onViewImage: (images: string[], index: number) => void;
}

export function ScaleTypeCard({ workTypeId, scale, onEdit, onViewImage }: ScaleTypeCardProps) {
  const { removeScaleType, settings } = useAppStore();
  const [currentImg, setCurrentImg] = useState(0);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev: number) => (prev + 1) % scale.images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImg((prev: number) => (prev - 1 + scale.images.length) % scale.images.length);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat().format(price);
  };

  return (
    <div className="glass animate-slide-up" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Image Section */}
        <div style={{ 
          width: '100%', 
          maxWidth: scale.images.length > 0 ? '240px' : '0px',
          height: scale.images.length > 0 ? '160px' : '0px',
          position: 'relative',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.2)',
          display: scale.images.length > 0 ? 'block' : 'none'
        }}>
          {scale.images.length > 0 && (
            <>
              <img 
                src={scale.images[currentImg]} 
                alt={scale.title}
                onClick={() => onViewImage(scale.images, currentImg)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
              />
              {scale.images.length > 1 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', pointerEvents: 'none' }}>
                  <button onClick={prevImg} className="btn-icon" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.3)', border: 'none', width: 28, height: 28 }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={nextImg} className="btn-icon" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.3)', border: 'none', width: 28, height: 28 }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem' }}>
                {currentImg + 1} / {scale.images.length}
              </div>
            </>
          )}
        </div>

        {/* Content Section */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{scale.title}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <Clock size={14} />
                <span>{scale.estimatedTime || 'N/A'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                {settings.currency}{formatPrice(scale.basePrice)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Base Price</div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
            {scale.description}
          </p>

          {scale.extraPricing && scale.extraPricing.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {scale.extraPricing.map((extra: PricingExtra, idx: number) => (
                <div key={idx} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  {extra.label}: {extra.type === 'flat' ? settings.currency : '+'}{formatPrice(extra.price)}{extra.type === 'percentage' ? '%' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '0.5rem', 
        marginTop: '0.5rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)'
      }}>
        <button className="btn-icon" onClick={onEdit} title="Edit Scale Type">
          <Edit2 size={16} />
        </button>
        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => {
          if(confirm('Delete this scale type?')) removeScaleType(workTypeId, scale.id);
        }} title="Delete Scale Type">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
