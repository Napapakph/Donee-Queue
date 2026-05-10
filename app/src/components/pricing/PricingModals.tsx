'use client';
import { useState, useRef } from 'react';
import { X, Check, Plus, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { WorkType, ScaleType, PricingExtra } from '@/lib/types';
import { ImageCropperModal } from '../ImageCropperModal';

interface WorkTypeModalProps {
  initialData?: Partial<WorkType>;
  onSave: (data: Omit<WorkType, 'id' | 'scales'>) => void;
  onClose: () => void;
}

export function WorkTypeModal({ initialData, onSave, onClose }: WorkTypeModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [showCropper, setShowCropper] = useState(false);
  const [tempImg, setTempImg] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re: any) => {
        setTempImg(re.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="section-title">{initialData ? 'Edit Work Type' : 'New Work Type'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. OMAKASE, Character Design..." />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this category..." />
          </div>
          <div className="form-group">
            <label className="label">Cover Image</label>
            <div style={{ position: 'relative', height: '140px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px dashed var(--border)' }}>
              {coverImage ? (
                <>
                  <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setCoverImage('')} className="btn-icon" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)' }}>
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                  <Upload size={24} opacity={0.5} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Upload Cover</span>
                  <input type="file" hidden accept="image/*" onChange={handleFile} />
                </label>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!title} onClick={() => onSave({ title, description, coverImage, visible: true })}>
            Save Work Type
          </button>
        </div>
      </div>
      {showCropper && (
        <ImageCropperModal 
          imageSrc={tempImg} 
          aspectRatio={16/9} 
          onCropDone={(res) => { setCoverImage(res.full); setShowCropper(false); }} 
          onCancel={() => setShowCropper(false)} 
        />
      )}
    </div>
  );
}

interface ScaleTypeModalProps {
  initialData?: Partial<ScaleType>;
  onSave: (data: Omit<ScaleType, 'id'>) => void;
  onClose: () => void;
}

export function ScaleTypeModal({ initialData, onSave, onClose }: ScaleTypeModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice || 0);
  const [estimatedTime, setEstimatedTime] = useState(initialData?.estimatedTime || '');
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [extraPricing, setExtraPricing] = useState<PricingExtra[]>(initialData?.extraPricing || []);
  
  const [showCropper, setShowCropper] = useState(false);
  const [tempImg, setTempImg] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re: any) => {
        setTempImg(re.target?.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const addExtra = () => {
    setExtraPricing([...extraPricing, { label: '', price: 0, type: 'flat' }]);
  };

  const updateExtra = (idx: number, field: keyof PricingExtra, value: any) => {
    const next = [...extraPricing];
    next[idx] = { ...next[idx], [field]: value };
    setExtraPricing(next);
  };

  const removeExtra = (idx: number) => {
    setExtraPricing(extraPricing.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="section-title">{initialData ? 'Edit Scale Type' : 'New Scale Type'}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Full Body" />
            </div>
            <div className="form-group">
              <label className="label">Estimated Time</label>
              <input className="input" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="e.g. 5-7 days" />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Base Price</label>
            <input className="input" type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's included in this scale?" />
          </div>

          <div className="form-group">
            <label className="label">Gallery Images</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {images.map((img: string, idx: number) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="btn-icon" style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', width: 20, height: 20 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label style={{ width: '80px', height: '80px', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}>
                <Plus size={20} opacity={0.5} />
                <input type="file" hidden accept="image/*" onChange={handleFile} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="label" style={{ margin: 0 }}>Extra Options / Modifiers</label>
              <button className="btn btn-sm btn-ghost" onClick={addExtra}><Plus size={14} /> Add Extra</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {extraPricing.map((extra: PricingExtra, idx: number) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="input" style={{ flex: 2 }} value={extra.label} onChange={e => updateExtra(idx, 'label', e.target.value)} placeholder="Label (e.g. Commercial)" />
                  <input className="input" style={{ flex: 1 }} type="number" value={extra.price} onChange={e => updateExtra(idx, 'price', Number(e.target.value))} placeholder="Price" />
                  <select className="select" style={{ flex: 1 }} value={extra.type} onChange={e => updateExtra(idx, 'type', e.target.value)}>
                    <option value="flat">Flat</option>
                    <option value="percentage">%</option>
                  </select>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeExtra(idx)}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!title} onClick={() => onSave({ title, description, basePrice, estimatedTime, images, extraPricing })}>
            Save Scale Type
          </button>
        </div>
      </div>
      {showCropper && (
        <ImageCropperModal 
          imageSrc={tempImg} 
          aspectRatio={1} 
          onCropDone={(res) => { setImages([...images, res.full]); setShowCropper(false); }} 
          onCancel={() => setShowCropper(false)} 
        />
      )}
    </div>
  );
}
