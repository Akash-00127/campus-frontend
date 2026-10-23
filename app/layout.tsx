import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Campus Drop Admin', description: 'Campus Drop operations', icons: { icon: '/campus-drop-icon.png' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
