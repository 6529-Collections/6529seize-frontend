import React, { ReactNode } from "react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/router";
import MobileBottomNavigation from "./MobileBottomNavigation";

// Simple placeholder for the header while it loads client-side
const HeaderPlaceholder = () => {
  // Style to roughly match header height
  return <div style={{ height: '56px' /* Adjust height as needed for mobile */ }}>Loading Header...</div>;
};

// Dynamically import Header, disable SSR, and use the placeholder
const Header = dynamic(() => import("../header/Header"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});

interface MobileLayoutProps {
  readonly children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  const router = useRouter();
  
  return (
    <div className="mobile-layout">
      <Header />
      
      <main className="mobile-main-content">
        {children}
      </main>
      
      <MobileBottomNavigation currentPath={router.pathname} />
      
      <style jsx>{`
        .mobile-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        .mobile-main-content {
          flex: 1;
          padding-bottom: 56px; /* Height of the bottom navigation */
        }
      `}</style>
    </div>
  );
};

export default MobileLayout;