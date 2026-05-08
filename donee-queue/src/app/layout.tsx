import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BoardProvider } from '@/context/BoardContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Donee Queue – Smart Queue Management',
  description: 'A flexible, Notion-inspired queue management tool with deadline tracking, income summary, and drag-and-drop reordering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <body>
        <BoardProvider>
          {children}
        </BoardProvider>
      </body>
    </html>
  );
}
