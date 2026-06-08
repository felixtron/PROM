import React from 'react';
import './globals.css';

export const metadata = {
  title: 'ProM - ProSuite Marketing Platform',
  description: 'Consola interna de optimización, maquetación y análisis de pauta de ProSuite.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#020617' }}>
        {children}
      </body>
    </html>
  );
}
