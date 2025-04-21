import React, { ReactNode } from "react";
import dynamic from 'next/dynamic';

// Simple placeholder for the header while it loads client-side
const HeaderPlaceholder = () => {
  // You might want to style this to roughly match the header's height
  // to prevent layout shifts
  return <div style={{ height: '60px' /* Adjust height as needed */ }}>Loading Header...</div>;
};

// Dynamically import Header, disable SSR, and use the placeholder
const Header = dynamic(() => import("../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface DesktopLayoutProps {
  readonly children: ReactNode;
  readonly hideFooter?: boolean;
}

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
};

export default DesktopLayout;