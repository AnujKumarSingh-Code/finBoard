import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'FinBoard - Customizable Finance Dashboard',
  description: 'Build your own real-time  finance monitoring dashboard with customizable widgets. Track stocks, crypto, forex, and more.',
  keywords: ['finance', 'dashboard'  , 'stocks', 'crypto', 'forex', 'trading', 'widgets', 'real-time'],
  authors: [{ name: 'FinBoard' }],
  creator: 'FinBoard',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'FinBoard - Customizable Finance Dashboard',
    description: 'Build your  own real-time finance monitoring dashboard with customizable widgets.',
    siteName: 'FinBoard',
  },
  twitter: {
    card: 'summary_large_image',

    title: 'FinBoard - Customizable Finance Dashboard',
    description: 'Build your own real-time finance monitoring dashboard with customizable widgets.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang ="en" suppressHydrationWarning>
      <body className ="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme ="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToastContainer />
          
        </ThemeProvider>
      </body>
    </html>
  );
}
