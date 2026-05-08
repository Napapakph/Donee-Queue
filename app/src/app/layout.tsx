import type { Metadata } from 'next';
import './globals.css';
import { TopBar } from '@/components/TopBar';
import { ToastProvider } from '@/components/ToastProvider';
import { ParticleCanvas } from '@/components/ParticleCanvas';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeApplier } from '@/components/ThemeApplier';

export const metadata: Metadata = {
  title: 'Donee Queue — Commission Art Manager',
  description: 'Manage your commissions, showcase your art, track income, and analyze your freelance business.',
  keywords: 'commission art, queue manager, freelance artist, art commissions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ThemeApplier />
            <ParticleCanvas />
            <TopBar />
            <main style={{
              position: 'relative',
              zIndex: 1,
              minHeight: '100vh',
              paddingTop: '60px',
            }}>
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
