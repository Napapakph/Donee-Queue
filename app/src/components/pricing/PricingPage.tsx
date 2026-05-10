'use client';
import { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { WorkType, ScaleType } from '../../lib/types';
import { WorkTypeSection } from './WorkTypeSection';
import { WorkTypeModal, ScaleTypeModal } from './PricingModals';
import { ImageLightbox } from '../ImageLightbox';
import { Plus, LayoutGrid, DollarSign, Info } from 'lucide-react';

export default function PricingPage() {
  const { workTypes, addWorkType, updateWorkType, addScaleType, updateScaleType, settings, role } = useAppStore();
  const isUser = role === 'user' || role === 'admin';
  
  // Modals state
  const [showWorkModal, setShowWorkModal] = useState<{ open: boolean; data?: WorkType }>({ open: false });
  const [showScaleModal, setShowScaleModal] = useState<{ open: boolean; workTypeId: string; data?: ScaleType }>({ open: false, workTypeId: '' });
  
  // Lightbox state
  const [lightbox, setLightbox] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 });
  
  // Sort state
  const [sortBy, setSortBy] = useState('default');

  const handleSaveWorkType = (data: Omit<WorkType, 'id' | 'scales'>) => {
    if (showWorkModal.data) {
      updateWorkType(showWorkModal.data.id, data);
    } else {
      addWorkType(data);
    }
    setShowWorkModal({ open: false });
  };

  const handleSaveScaleType = (data: Omit<ScaleType, 'id'>) => {
    if (showScaleModal.data) {
      updateScaleType(showScaleModal.workTypeId, showScaleModal.data.id, data);
    } else {
      addScaleType(showScaleModal.workTypeId, data);
    }
    setShowScaleModal({ open: false, workTypeId: '' });
  };

  const sortedWorkTypes = [...workTypes].sort((a, b) => {
    const getMinPrice = (wt: WorkType) => wt.scales?.length ? Math.min(...wt.scales.map(s => s.basePrice)) : 0;
    const getMaxPrice = (wt: WorkType) => wt.scales?.length ? Math.max(...wt.scales.map(s => s.basePrice)) : 0;
    const getFirstPrice = (wt: WorkType) => wt.scales?.[0]?.basePrice || 0;

    if (sortBy === 'wt-price-asc') return getFirstPrice(a) - getFirstPrice(b);
    if (sortBy === 'wt-price-desc') return getFirstPrice(b) - getFirstPrice(a);
    if (sortBy === 'sc-price-asc') return getMinPrice(a) - getMinPrice(b);
    if (sortBy === 'sc-price-desc') return getMaxPrice(b) - getMaxPrice(a);
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Actions */}
      {isUser && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowWorkModal({ open: true })}>
            <Plus size={20} /> Add New Work Type
          </button>
        </div>
      )}

      {/* Analytics Summary - Conceptual */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '3rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid var(--accent-glow)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="btn-icon" style={{ background: 'var(--accent)', color: '#fff', width: 48, height: 48, borderRadius: '12px' }}>
               <DollarSign size={24} />
            </div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pricing Strategy</div>
               <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {workTypes.length} Categories · {workTypes.reduce((acc: number, curr: WorkType) => acc + (curr.scales?.length || 0), 0)} Scale Tiers
               </div>
            </div>
         </div>
         <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sort By:</span>
            <select 
              className="select" 
              style={{ width: 'auto', minWidth: '180px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default Order</option>
              <option value="wt-price-asc">Work Type Price: Low to High</option>
              <option value="wt-price-desc">Work Type Price: High to Low</option>
              <option value="sc-price-asc">Scale Min Price: Low to High</option>
              <option value="sc-price-desc">Scale Max Price: High to Low</option>
            </select>
         </div>
      </div>

      {/* Work Types Grid */}
      <div style={{ 
        display: 'flex', 
        gap: '2rem', 
        overflowX: 'auto', 
        paddingBottom: '2rem',
        alignItems: 'flex-start',
        scrollSnapType: 'x mandatory'
      }}>
        {sortedWorkTypes.map((wt: WorkType) => (
          <div key={wt.id} style={{ scrollSnapAlign: 'start' }}>
            <WorkTypeSection 
              workType={wt}
              onEdit={() => setShowWorkModal({ open: true, data: wt })}
              onAddScale={() => setShowScaleModal({ open: true, workTypeId: wt.id })}
              onEditScale={(scale) => setShowScaleModal({ open: true, workTypeId: wt.id, data: scale })}
              onViewImage={(imgs, idx) => setLightbox({ open: true, images: imgs, index: idx })}
            />
          </div>
        ))}

        {workTypes.length === 0 && (
          <div style={{ width: '100%', padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
             <LayoutGrid size={64} opacity={0.1} style={{ margin: '0 auto 1rem' }} />
             <h3>No Work Types yet</h3>
             <p>Start by adding your first commission category.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWorkModal.open && (
        <WorkTypeModal 
          initialData={showWorkModal.data}
          onSave={handleSaveWorkType}
          onClose={() => setShowWorkModal({ open: false })}
        />
      )}

      {showScaleModal.open && (
        <ScaleTypeModal 
          initialData={showScaleModal.data}
          onSave={handleSaveScaleType}
          onClose={() => setShowScaleModal({ open: false, workTypeId: '' })}
        />
      )}

      {/* Lightbox */}
      {lightbox.open && (
        <ImageLightbox 
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox({ ...lightbox, open: false })}
        />
      )}
    </div>
  );
}
