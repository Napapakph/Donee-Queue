import { AppSettings } from './types';

export const applyWatermark = async (base64: string, settings: AppSettings): Promise<string> => {
  if (settings.watermarkType === 'none') return base64;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Setup watermark style
      const fontSize = Math.max(20, Math.floor(img.width / 15));
      ctx.font = `bold ${fontSize}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = settings.watermarkText || 'PROTECTED';
      
      if (settings.watermarkType === 'text') {
        ctx.save();
        
        // Shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;

        // Repeated diagonal watermark
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        
        const stepX = fontSize * 6;
        const stepY = fontSize * 3;
        
        for (let x = -canvas.width * 1.5; x < canvas.width * 1.5; x += stepX) {
          for (let y = -canvas.height * 1.5; y < canvas.height * 1.5; y += stepY) {
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
          }
        }
        ctx.restore();

        // Corner watermark (Extra security)
        const padding = 20;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.font = `bold ${fontSize / 1.5}px "Outfit", sans-serif`;
        ctx.strokeText(text, canvas.width - padding, canvas.height - padding);
        ctx.fillText(text, canvas.width - padding, canvas.height - padding);
      } else if (settings.watermarkType === 'image' && settings.watermarkImage) {
        const wmImg = new Image();
        wmImg.crossOrigin = 'anonymous';
        wmImg.onload = () => {
          const wmWidth = img.width * 0.2;
          const wmHeight = (wmImg.height * wmWidth) / wmImg.width;
          const padding = 20;
          
          ctx.globalAlpha = 0.5;
          ctx.drawImage(wmImg, canvas.width - wmWidth - padding, canvas.height - wmHeight - padding, wmWidth, wmHeight);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        wmImg.onerror = () => resolve(base64);
        wmImg.src = settings.watermarkImage;
        return;
      }

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image for watermarking'));
    img.src = base64;
  });
};
