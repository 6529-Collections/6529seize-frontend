import type { Metadata } from 'next';
import { ReactNode } from 'react';
import '../styles/globals.scss';

// Additional global styles from _app.tsx
import "../styles/seize-bootstrap.scss";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "../styles/swiper.scss";
import "../components/drops/create/lexical/lexical.styles.scss";

// Import CoreClientProviders
import CoreClientProviders from '../components/shared/CoreClientProviders'; // Adjusted path

export const metadata: Metadata = {
  title: '6529.io',
  description: 'Welcome to 6529.io',
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CoreClientProviders>
          {children}
        </CoreClientProviders>
      </body>
    </html>
  );
} 
