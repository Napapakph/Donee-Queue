'use client';
import { WorkType, ScaleType } from '../../lib/types';
import { ScaleTypeCard } from './ScaleTypeCard';
import { Edit2, Trash2, Plus, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { createClient } from '../../lib/supabase/client';
import { useToast } from '../ToastProvider';

interface WorkTypeSectionProps {
  workType: WorkType;
  onEdit: () => void;
  onAddScale: () => void;
  onEditScale: (scale: ScaleType) => void;
  onViewImage: (images: string[], index: number) => void;
}

export function WorkTypeSection({ workType, onEdit, onAddScale, onEditScale, onViewImage }: WorkTypeSectionProps) {
  const { removeWorkType } = useAppStore();
  const supabase = createClient();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm('Delete entire Work Type and all its scales?')) return;
    try {
      const { error } = await supabase.from('work_types').delete().eq('id', workType.id);
      if (error) throw error;
      removeWorkType(workType.id);
      toast('Work Type deleted', 'success');
    } catch (err: any) {
      toast(`Delete failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="glass" style={{
      display: 'flex',
      flexDirection: 'column',
      minWidth: '320px',
      width: '100%',
      maxWidth: '500px',
      height: 'fit-content',
      padding: '0',
      overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      {/* Header / Cover */}
      <div style={{ position: 'relative', height: '180px', width: '100%', background: 'rgba(0,0,0,0.4)' }}>
        {workType.coverImage ? (
          <img src={workType.coverImage} alt={workType.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <ImageIcon size={48} opacity={0.2} />
          </div>
        )}
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(13,13,20,0.9))',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{workType.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>{workType.description}</p>
             </div>
             <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={onEdit}>
                  <Edit2 size={14} />
                </button>
                <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'var(--danger)' }} onClick={handleDelete}>
                  <Trash2 size={14} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Scales List */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span className="label" style={{ margin: 0 }}>Scale Types</span>
          <span className="badge badge-gray">{workType.scales?.length || 0}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {workType.scales?.map((scale: ScaleType) => (
            <ScaleTypeCard 
              key={scale.id} 
              workTypeId={workType.id} 
              scale={scale} 
              onEdit={() => onEditScale(scale)}
              onViewImage={onViewImage}
            />
          ))}

          <button 
            className="btn btn-ghost" 
            style={{ 
              width: '100%', 
              borderStyle: 'dashed', 
              background: 'rgba(255,255,255,0.02)',
              marginTop: '0.5rem'
            }}
            onClick={onAddScale}
          >
            <Plus size={16} /> Add Scale Type
          </button>
        </div>
      </div>
    </div>
  );
}
