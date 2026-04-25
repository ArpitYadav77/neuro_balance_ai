import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuroBalance AI — Real-Time Cognitive Stress Monitor',
  description:
    'Passively monitor your cognitive stress and mental fatigue using your webcam. No extra hardware. Powered by MediaPipe and AI.',
  keywords: ['cognitive stress', 'eye tracking', 'mental health', 'productivity', 'AI'],
  openGraph: {
    title: 'NeuroBalance AI',
    description: 'Know Your Mind. Before It Breaks.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
