import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'StrangerConfide - Tâm sự với người lạ',
  description: 'Ứng dụng chat ẩn danh an toàn, kết nối những tâm hồn cần được lắng nghe.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
