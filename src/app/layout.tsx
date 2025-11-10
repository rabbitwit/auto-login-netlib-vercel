import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NetBar Library Auto Login',
  description: 'Automated login system for NetBar Library',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}