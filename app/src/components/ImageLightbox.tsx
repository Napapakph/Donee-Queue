'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const src = images[currentIndex];

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Apply watermark
      if (settings.watermarkType !== 'none') {
        if (settings.watermarkType === 'text' && settings.watermarkText) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((-30 * Math.PI) / 180);
          
          ctx.font = `bold ${Math.max(30, canvas.width / 15)}px sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const stepX = Math.max(300, canvas.width / 3);
          const stepY = Math.max(150, canvas.height / 4);
          for (let x = -canvas.width; x <= canvas.width; x += stepX) {
            for (let y = -canvas.height; y <= canvas.height; y += stepY) {
              ctx.fillText(settings.watermarkText, x, y);
            }
          }
          ctx.restore();
        } else if (settings.watermarkType === 'image' && settings.watermarkImage) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          wmImg.onload = () => {
             const size = Math.max(100, canvas.width / 6);
             ctx.globalAlpha = 0.4;
             const stepX = size * 2;
             const stepY = size * 2;
             for (let x = 0; x <= canvas.width; x += stepX) {
               for (let y = 0; y <= canvas.height; y += stepY) {
                 ctx.drawImage(wmImg, x, y, size, size * (wmImg.height/wmImg.width));
               }
             }
             ctx.globalAlpha = 1.0;
          };
          wmImg.src = settings.watermarkImage;
        }
      }
    };
    img.src = src;
  }, [src, settings]);

  const handleNext = () => setCurrentIndex((i) => (i + 1) % images.length);
  const handlePrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 20,
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', cursor: 'pointer', zIndex: 10
      }}>
        <X size={24} />
      </button>

      {images.length > 1 && (
        <>
          <button onClick={handlePrev} style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 10
          }}>
            <ChevronLeft size={28} />
          </button>
          <button onClick={handleNext} style={{
            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 10
          }}>
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: '1rem', zIndex: 10 }}>
         <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><ZoomOut size={20}/></button>
         <button onClick={() => { setScale(1); setPos({x:0, y:0}); }} className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>1:1</button>
         <button onClick={() => setScale(s => Math.min(4, s + 0.25))} className="btn-icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}><ZoomIn size={20}/></button>
      </div>

      <div 
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onPointerDown={(e) => {
          setIsDragging(true);
          setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y });
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!isDragging) return;
          setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
        }}
        onPointerUp={(e) => {
          setIsDragging(false);
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <canvas 
          ref={canvasRef} 
          style={{ 
            maxWidth: '90vw', maxHeight: '90vh', 
            objectFit: 'contain', 
            pointerEvents: 'none',
            display: 'block',
            borderRadius: 8,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }} 
          onContextMenu={(e) => {
             // Let them save if they want, it will have the watermark!
          }}
        />
      </div>
      
      {images.length > 1 && (
        <div style={{ position: 'absolute', top: 20, left: 20, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.9rem' }}>
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body
  );
}
