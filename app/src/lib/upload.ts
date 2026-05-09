import { createClient } from './supabase/client';

const base64ToBlob = (base64: string) => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const uploadBase64Image = async (base64: string, userId: string, folder: string): Promise<string> => {
  // If it's already a URL (e.g. from previous upload), just return it
  if (base64.startsWith('http')) return base64;
  
  const supabase = createClient();
  const blob = base64ToBlob(base64);
  const ext = blob.type.split('/')[1] || 'jpg';
  const fileName = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  
  const { data, error } = await supabase.storage.from('images').upload(fileName, blob, { 
    contentType: blob.type,
    upsert: false 
  });
  
  if (error) {
    throw new Error(`Storage error: ${error.message}`);
  }
  
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
  return publicUrl;
};
