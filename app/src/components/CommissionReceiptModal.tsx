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
  platform?: any;
  settings: any;
  profile: any;
  onClose: () => void;
}

export function CommissionReceiptModal({ card, workType, scale, platform, settings, profile, onClose }: CommissionReceiptProps) {
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
      <div className="modal-content" style={{ 
        maxWidth: 'min(95vw, 700px)', 
        maxHeight: '92vh', 
        padding: 0, 
        background: 'transparent', 
        boxShadow: 'none',
        overflowY: 'auto',
        borderRadius: '24px',
        scrollbarWidth: 'none'
      }}>
        
        {/* Actions Bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(20, 10, 30, 0.4)', backdropFilter: 'blur(10px)', borderRadius: '12px' }}>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem' }} onClick={() => handleExportImage('png')} disabled={isExporting}>
            <Camera size={14} /> Export PNG
          </button>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem' }} onClick={() => handleExportImage('jpg')} disabled={isExporting}>
            <Camera size={14} /> Export JPG
          </button>
          <button className="btn btn-ghost btn-sm" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem' }} onClick={handleExportPDF} disabled={isExporting}>
            <FileText size={14} /> PDF
          </button>
          <button className="btn btn-icon btn-sm" style={{ background: 'var(--danger)', color: 'white', width: 32, height: 32 }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* The Receipt Container */}
        <div 
          ref={receiptRef}
          style={{
            background: '#ffffff',
            color: '#4b5563',
            padding: '0',
            borderRadius: '24px',
            position: 'relative',
            fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '12px solid var(--accent)',
            backgroundImage: 'radial-gradient(var(--accent-glow) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* Top Decorative Header Area */}
          <div style={{ 
            background: 'linear-gradient(135deg, white, var(--accent-glow))',
            padding: '2.5rem 2rem',
            borderBottom: '1px solid var(--accent-glow)',
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
            position: 'relative'
          }}>
            {/* Sparkles everywhere */}
            <Sparkles style={{ position: 'absolute', top: 15, right: 20, color: 'var(--accent)', opacity: 0.3 }} size={32} />
            <Sparkles style={{ position: 'absolute', bottom: 15, left: 150, color: 'var(--accent)', opacity: 0.2 }} size={24} />

            {/* Avatar Circle */}
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: 140, height: 140, borderRadius: '50%', 
                border: '6px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                overflow: 'hidden', background: 'var(--accent-glow)'
              }}>
                {profile.avatar ? (
                  <img src={profile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="artist" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>✦</div>
                )}
              </div>
              <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'white', borderRadius: '50%', padding: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                 🐈
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '2.8rem', 
                fontWeight: 900, 
                color: 'var(--accent)', 
                lineHeight: 1,
                marginBottom: '0.5rem',
                letterSpacing: '-1px'
              }}>
                Commission <br/> <span style={{ fontSize: '1.4rem', letterSpacing: '8px', opacity: 0.8 }}>RECEIPT</span>
              </h1>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <div style={{ background: 'var(--accent)', color: 'white', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                  RECEIPT NO. <span style={{ opacity: 0.8 }}>#{card.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div style={{ border: '2px solid var(--accent)', color: 'var(--accent)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>
                  DATE <span style={{ opacity: 0.8 }}>{format(new Date(), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            {/* Main Grid for Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Client Info Section */}
              <section style={{ 
                background: 'rgba(255,255,255,0.8)', 
                padding: '1.5rem', 
                borderRadius: '24px', 
                border: '2px solid var(--accent-glow)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <User size={16} style={{ color: 'var(--accent)' }} />
                  <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Client Information</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                     <span style={{ opacity: 0.6 }}>Name</span>
                     <span style={{ fontWeight: 800 }}>{card.customerName}</span>
                   </div>
                   <div style={{ width: '100%', height: '1px', borderBottom: '1px dashed var(--accent-glow)' }} />
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                     <span style={{ opacity: 0.6 }}>Platform</span>
                     <span style={{ fontWeight: 800 }}>{platform?.name || 'Private'}</span>
                   </div>
                </div>
              </section>

              {/* Schedule Section */}
              <section style={{ 
                background: 'rgba(255,255,255,0.8)', 
                padding: '1.5rem', 
                borderRadius: '24px', 
                border: '2px solid var(--accent-glow)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <Calendar size={16} style={{ color: 'var(--accent)' }} />
                  <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Schedule</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>START DATE</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{format(new Date(card.commissionDate), 'dd MMM yyyy')}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.3 }}>← TO →</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800 }}>END DATE (ETA)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{format(new Date(card.deadlineDate), 'dd MMM yyyy')}</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Commission Details Full Width */}
            <section style={{ 
              background: 'rgba(255,255,255,0.9)', 
              padding: '1.5rem', 
              borderRadius: '24px', 
              border: '2px solid var(--accent-glow)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <Info size={16} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Commission Details</h2>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div>
                     <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.25rem' }}>WORK TYPE</div>
                     <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>{workType?.title || 'Custom Commission'}</div>
                   </div>
                   <div style={{ width: '100%', height: '1px', borderBottom: '1px dashed var(--accent-glow)' }} />
                   <div>
                     <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.25rem' }}>SCALE</div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{scale?.title || 'No scale specified'}</div>
                   </div>
                   {card.description && (
                     <>
                      <div style={{ width: '100%', height: '1px', borderBottom: '1px dashed var(--accent-glow)' }} />
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.5, marginBottom: '0.25rem' }}>DESCRIPTION / DETAILS</div>
                        <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{card.description}</div>
                      </div>
                     </>
                   )}
                </div>
                {card.images && card.images[0] && (
                  <div style={{ width: 160, height: 220, borderRadius: '16px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <img src={card.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                  </div>
                )}
              </div>
            </section>

            {/* Payment Summary */}
            <section style={{ 
              background: 'rgba(255,255,255,0.9)', 
              padding: '1.5rem', 
              borderRadius: '24px', 
              border: '2px solid var(--accent-glow)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <CreditCard size={16} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment Summary</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                   <span>Price</span>
                   <span style={{ fontWeight: 800 }}>{settings.currency}{(card.price * card.quantity).toLocaleString()}</span>
                 </div>
                 <div style={{ width: '100%', height: '1px', borderBottom: '1px dashed var(--accent-glow)' }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                   <span style={{ fontSize: '1rem', fontWeight: 900 }}>TOTAL AMOUNT</span>
                   <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>{settings.currency}{(card.price * card.quantity).toLocaleString()}</span>
                 </div>
              </div>
            </section>

            {/* Payment Status Banner */}
            {isPaid && (
              <div style={{ 
                background: 'linear-gradient(90deg, var(--accent-glow), white)', 
                padding: '1.5rem', 
                borderRadius: '24px',
                border: '2px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '1.5rem'
              }}>
                <div style={{ position: 'absolute', top: -10, left: -10, opacity: 0.1 }}>✦</div>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.5, marginBottom: '0.25rem' }}>PAYMENT STATUS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px' }}>FULL PAYMENT</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.8 }}>Thank you so much! ♡</div>
                </div>
                <div style={{ fontSize: '3.5rem' }}>🐈</div>
              </div>
            )}

            <div style={{ textAlign: 'center', padding: '0.5rem 0', opacity: 0.6, fontSize: '0.8rem' }}>
               Thank you for supporting my work!<br/>
               I will do my best to create the best artwork for you.
            </div>
          </div>

          {/* New Artist Footer Bar */}
          <footer style={{ 
            background: 'var(--accent)', 
            color: 'white', 
            padding: '1rem 2rem', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            fontSize: '0.9rem',
            fontWeight: 800,
            letterSpacing: '1px'
          }}>
            {profile.displayName || 'Artist'}
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
