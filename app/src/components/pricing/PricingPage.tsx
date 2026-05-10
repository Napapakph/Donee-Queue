'use client';
import { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { WorkType, ScaleType } from '../../lib/types';
import { WorkTypeSection } from './WorkTypeSection';
import { WorkTypeModal, ScaleTypeModal } from './PricingModals';
import { ImageLightbox } from '../ImageLightbox';
import { Plus, LayoutGrid, DollarSign, Info, X } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { useToast } from '../ToastProvider';

export default function PricingPage() {
  const { workTypes, addWorkType, updateWorkType, addScaleType, updateScaleType, settings, role } = useAppStore();
  const isUser = role === 'user' || role === 'admin';

  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  
  // Modals state
  const [showWorkModal, setShowWorkModal] = useState<{ open: boolean; data?: WorkType }>({ open: false });
  const [showScaleModal, setShowScaleModal] = useState<{ open: boolean; workTypeId: string; data?: ScaleType }>({ open: false, workTypeId: '' });
  
  // Lightbox state
  const [lightbox, setLightbox] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 });
  
  // Sort state
  const [sortBy, setSortBy] = useState('default');

  const supabase = createClient();
  const { toast } = useToast();

  const handleSaveWorkType = async (data: Omit<WorkType, 'id' | 'scales'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast('Not logged in', 'error');

      const id = crypto.randomUUID();
      const dbData = {
        id,
        name: data.title,
        description: data.description,
        visible: data.visible,
        user_id: user.id,
        examples: [] // Initialize empty scales JSON
      };

      if (showWorkModal.data) {
        const { error } = await supabase.from('work_types').update({
          name: data.title,
          description: data.description,
          cover_image: data.coverImage,
          visible: data.visible
        }).eq('id', showWorkModal.data.id);
        if (error) throw error;
        updateWorkType(showWorkModal.data.id, data);
        toast('Work Type updated', 'success');
      } else {
        const newId = uid();
        const { error } = await supabase.from('work_types').insert({
          id: newId,
          name: data.title,
          description: data.description,
          cover_image: data.coverImage,
          visible: data.visible,
          user_id: user.id,
          examples: []
        });
        if (error) throw error;
        addWorkType({ ...data, id });
        toast('Work Type added', 'success');
      }
    } catch (err: any) {
      toast(`Failed to save: ${err.message}`, 'error');
    }
    setShowWorkModal({ open: false });
  };

  const handleSaveScaleType = async (data: Omit<ScaleType, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast('Not logged in', 'error');

      // Get current work type to update its scales array
      const wt = workTypes.find(t => t.id === showScaleModal.workTypeId);
      if (!wt) return;

      let updatedScales = [...(wt.scales || [])];
      if (showScaleModal.data) {
        updatedScales = updatedScales.map(s => s.id === showScaleModal.data!.id ? { ...s, ...data } : s);
      } else {
        updatedScales.push({ id: uid(), ...data });
      }

      // Sync the ENTIRE scales array to the work_types.examples column
      const { error } = await supabase
        .from('work_types')
        .update({ examples: updatedScales })
        .eq('id', wt.id);

      if (error) throw error;

      // Update local store
      if (showScaleModal.data) {
        updateScaleType(wt.id, showScaleModal.data.id, data);
      } else {
        addScaleType(wt.id, data);
      }
      toast('Scale Type saved to cloud', 'success');
    } catch (err: any) {
      toast(`Failed to save scale: ${err.message}`, 'error');
    }
    setShowScaleModal({ open: false, workTypeId: '' });
  };

  // Sort & Filter state
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [filterScaleType, setFilterScaleType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const filteredWorkTypes = workTypes.filter(wt => {
    if (filterWorkType !== 'all' && wt.id !== filterWorkType) return false;
    
    // Check if any scale matches the scale type and price filters
    const hasMatchingScale = wt.scales?.some(s => {
      const matchesScale = filterScaleType === 'all' || s.id === filterScaleType || s.title === filterScaleType;
      const matchesMin = !minPrice || s.basePrice >= Number(minPrice);
      const matchesMax = !maxPrice || s.basePrice <= Number(maxPrice);
      return matchesScale && matchesMin && matchesMax;
    });

    return hasMatchingScale || (wt.scales?.length === 0 && filterScaleType === 'all');
  }).map(wt => ({
    ...wt,
    // Filter scales inside the work type to only show matching ones
    scales: (wt.scales || []).filter(s => {
      const matchesScale = filterScaleType === 'all' || s.id === filterScaleType || s.title === filterScaleType;
      const matchesMin = !minPrice || s.basePrice >= Number(minPrice);
      const matchesMax = !maxPrice || s.basePrice <= Number(maxPrice);
      return matchesScale && matchesMin && matchesMax;
    })
  }));

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

      {/* Pricing Strategy Card with Filters */}
      <div className="glass" style={{ 
        padding: '1.5rem 2rem', 
        marginBottom: '3rem', 
        display: 'flex', 
        gap: '2rem', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        background: 'rgba(168, 85, 247, 0.05)', 
        borderRadius: '16px',
        border: '1px solid var(--accent-glow)',
        boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)'
      }}>
         {/* Left Side: Summary */}
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

         {/* Right Side: Filters */}
         <div style={{ flex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select 
                  className="select" 
                  style={{ width: 'auto', minWidth: '140px', borderRadius: '100px', background: '#fff', color: '#000', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  value={filterWorkType}
                  onChange={(e) => setFilterWorkType(e.target.value)}
                >
                  <option value="all">Work type</option>
                  {workTypes.map(wt => <option key={wt.id} value={wt.id}>{wt.title}</option>)}
                </select>

                <select 
                  className="select" 
                  style={{ width: 'auto', minWidth: '140px', borderRadius: '100px', background: '#fff', color: '#000', border: 'none', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  value={filterScaleType}
                  onChange={(e) => setFilterScaleType(e.target.value)}
                >
                  <option value="all">scale type</option>
                  {Array.from(new Set(workTypes.flatMap(wt => wt.scales?.map(s => s.title) || []))).map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>price</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '4px 12px', borderRadius: '100px' }}>
                   <span style={{ color: '#aaa', fontSize: '0.8rem' }}>$</span>
                   <input 
                     type="number" 
                     placeholder="0" 
                     style={{ width: '60px', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#000' }}
                     value={minPrice}
                     onChange={(e) => setMinPrice(e.target.value)}
                   />
                   <span style={{ color: '#aaa' }}>-</span>
                   <input 
                     type="number" 
                     placeholder="500" 
                     style={{ width: '60px', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#000' }}
                     value={maxPrice}
                     onChange={(e) => setMaxPrice(e.target.value)}
                   />
                </div>
            </div>

            {(filterWorkType !== 'all' || filterScaleType !== 'all' || minPrice || maxPrice) && (
              <button 
                className="btn-icon" 
                style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setFilterWorkType('all');
                  setFilterScaleType('all');
                  setMinPrice('');
                  setMaxPrice('');
                }}
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
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
        {filteredWorkTypes.map((wt: WorkType) => (
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
