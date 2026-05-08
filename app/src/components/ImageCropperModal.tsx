import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropDone: (res: { full: string, thumb: string }) => void;
  onCancel: () => void;
  aspectRatio?: number; // e.g. 16/9, 1, etc.
}

export function ImageCropperModal({ imageSrc, onCropDone, onCancel, aspectRatio }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    if (aspectRatio) {
      const initialCrop = centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
        width,
        height
      );
      setCrop(initialCrop);
    } else {
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
    }
  }

  const handleComplete = () => {
    if (!completedCrop || !imgRef.current) return onCancel();

    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = Math.floor(completedCrop.width * scaleX);
    canvas.height = Math.floor(completedCrop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) return onCancel();

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const thumb = canvas.toDataURL('image/jpeg', 0.9);
    onCropDone({ full: imageSrc, thumb });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700 }}>Crop Image</h3>
          <button onClick={onCancel} className="btn-icon"><X size={20} /></button>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', justifyContent: 'center', background: '#000' }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
          >
            <img 
              ref={imgRef} 
              src={imageSrc} 
              alt="Crop" 
              onLoad={onImageLoad} 
              style={{ maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleComplete}><Check size={16} /> Apply Crop</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
