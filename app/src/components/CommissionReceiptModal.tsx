'use client';
import React, { useRef, useState } from 'react';
import { X, Download, Star, Heart, Sparkles, Calendar, CreditCard, User, Info, FileText, Share2, Camera } from 'lucide-react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createPortal } from 'react-dom';
import { useToast } from '@/components/ToastProvider';

interface CommissionReceiptProps {
  card: any;
  workType?: any;
  scale?: any;
  settings: any;
  profile: any;
  onClose: () => void;
}

export function CommissionReceiptModal({ card, workType, scale, settings, profile, onClose }: CommissionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportImage = async (format: 'png' | 'jpg') => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    toast('Generating image...', 'info');
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // High quality
        backgroundColor: '#fffaf5',
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `receipt-${card.id.slice(0, 8)}.${format}`;
      link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.9);
      link.click();
      toast(`Receipt exported as ${format.toUpperCase()}`, 'success');
    } catch (err) {
      toast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    toast('Generating PDF...', 'info');

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#fffaf5',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${card.id.slice(0, 8)}.pdf`);
      toast('Receipt exported as PDF', 'success');
    } catch (err) {
      toast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  const totalAmount = card.price * card.quantity;
  const isPaid = card.paymentStatus === 'paid';

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 99999, background: 'rgba(20, 10, 30, 0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="modal-content" style={{ maxWidth: 'min(95vw, 500px)', padding: 0, background: 'transparent', boxShadow: 'none' }}>
        
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem', padding: '0 1rem' }}>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => handleExportImage('png')} disabled={isExporting}>
            <Camera size={14} /> PNG
          </button>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => handleExportImage('jpg')} disabled={isExporting}>
            <Camera size={14} /> JPG
          </button>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={handleExportPDF} disabled={isExporting}>
            <FileText size={14} /> PDF
          </button>
          <button className="btn btn-icon btn-sm" style={{ background: 'var(--danger)', color: 'white' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* The Receipt Container */}
        <div 
          ref={receiptRef}
          style={{
            background: '#fffaf5',
            color: '#5d4e6d',
            padding: '2.5rem 2rem',
            borderRadius: '24px',
            position: 'relative',
            fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '8px solid #f3e8ff',
          }}
        >
          {/* Decorative Sparkles & Elements */}
          <Sparkles style={{ position: 'absolute', top: 20, left: 20, color: '#e9d5ff', opacity: 0.6 }} size={24} />
          <Heart style={{ position: 'absolute', top: 60, right: 30, color: '#fbcfe8', opacity: 0.5 }} size={20} />
          <Star style={{ position: 'absolute', bottom: 100, left: 15, color: '#fef3c7', opacity: 0.8 }} size={18} />
          
          {/* Lace-like Border Accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 10, background: 'radial-gradient(circle, #f3e8ff 4px, transparent 5px)', backgroundSize: '16px 16px' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, background: 'radial-gradient(circle, #f3e8ff 4px, transparent 5px)', backgroundSize: '16px 16px' }} />

          {/* Header */}
          <header style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative' }}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                Commission Receipt
              </h1>
              <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, transparent, #c084fc, transparent)', margin: '0 auto' }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginTop: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              #{card.id.slice(0, 8).toUpperCase()} • {format(new Date(), 'MMMM dd, yyyy')}
            </div>
          </header>

          {/* Client Info */}
          <section style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <User size={14} style={{ color: '#c084fc' }} />
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9d67e3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Information</h2>
            </div>
            <div style={{ background: '#fdf4ff', padding: '1rem', borderRadius: '16px', border: '1px solid #fae8ff' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#5b21b6' }}>{card.customerName}</div>
              <div style={{ fontSize: '0.85rem', color: '#7e22ce', opacity: 0.8, marginTop: '0.2rem' }}>{card.platformId || 'Private Client'}</div>
            </div>
          </section>

          {/* Commission Details */}
          <section style={{ marginBottom: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Info size={14} style={{ color: '#c084fc' }} />
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9d67e3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commission Details</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Type</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                  {workType?.title || 'Custom Commission'}
                </span>
              </div>
              {scale && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Scale</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4338ca', background: '#eef2ff', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>
                    {scale.title}
                  </span>
                </div>
              )}
              {card.description && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                  "{card.description}"
                </div>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Calendar size={14} style={{ color: '#c084fc' }} />
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9d67e3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>Started</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532d' }}>{format(new Date(card.commissionDate), 'MMM dd, yyyy')}</div>
              </div>
              <div style={{ background: '#fff1f2', padding: '0.75rem', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
                <div style={{ fontSize: '0.65rem', color: '#9f1239', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>Deadline</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#881337' }}>{format(new Date(card.deadlineDate), 'MMM dd, yyyy')}</div>
              </div>
            </div>
          </section>

          {/* Divider with Bow/Ribbon */}
          <div style={{ position: 'relative', height: '20px', marginBottom: '2rem' }}>
            <div style={{ position: 'absolute', top: '10px', left: 0, right: 0, height: '2px', background: '#f3e8ff', zIndex: 1 }} />
            <div style={{ 
              position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
              background: '#fffaf5', padding: '0 10px', color: '#c084fc'
            }}>
              <Heart size={16} fill="#c084fc" />
            </div>
          </div>

          {/* Payment Summary */}
          <section style={{ marginBottom: '2rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CreditCard size={14} style={{ color: '#c084fc' }} />
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#9d67e3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Summary</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Subtotal</span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>{settings.currency}{totalAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '2px dashed #f3e8ff' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#7c3aed' }}>TOTAL</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7c3aed' }}>{settings.currency}{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Paid Stamp */}
          {isPaid && (
            <div style={{
              position: 'absolute',
              bottom: '80px',
              right: '30px',
              width: '100px',
              height: '100px',
              border: '6px double #4ade80',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ade80',
              fontWeight: 900,
              fontSize: '1.5rem',
              transform: 'rotate(-25deg)',
              opacity: 0.6,
              pointerEvents: 'none',
              zIndex: 10,
              textShadow: '0 0 10px rgba(74, 222, 128, 0.2)',
            }}>
              <div style={{ border: '2px solid #4ade80', borderRadius: '50%', padding: '10px' }}>
                PAID
              </div>
            </div>
          )}

          {/* Footer */}
          <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #f3e8ff' }}>
            <p style={{ fontSize: '0.85rem', color: '#9d67e3', fontWeight: 600, marginBottom: '0.5rem' }}>
              Thank you for supporting my artwork! ♡
            </p>
            <div style={{ fontSize: '0.7rem', color: '#c084fc', opacity: 0.8 }}>
              {profile.displayName} • Commission Services
            </div>
          </footer>

          {/* Tiny Cat Icon Accent */}
          <div style={{ position: 'absolute', bottom: 15, right: 15, opacity: 0.2 }}>
             🐈
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
