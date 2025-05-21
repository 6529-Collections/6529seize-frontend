import React, { useRef, useState, useEffect } from "react";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import DirectMessagesList from "../direct-messages/DirectMessagesList";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { TabToggle } from "../../common/TabToggle";
import { useRouter } from "next/router";
import useDeviceInfo from "../../../hooks/useDeviceInfo";

// Define tab types for better type safety
type TabOption = "waves" | "messages";

const BrainMobileWaves: React.FC = () => {
  const { mobileWavesViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  
  // Container styles for scrolling and spacing
  const containerClassName = "tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 " +
    "tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 " +
    "tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2";

  // Initialize tab state from URL (only if not in app)
  const [activeTab, setActiveTab] = useState<TabOption>(() => 
    router.query.view === "messages" ? "messages" : "waves"
  );

  // Handle tab selection
  const handleTabChange = (key: string): void => {
    if (key !== "waves" && key !== "messages") return;
    
    const tab = key as TabOption;
    setActiveTab(tab);
    
    // Update URL without affecting browser history
    const currentQuery = { ...router.query };
    
    if (tab === "messages") {
      currentQuery.view = "messages";
    } else {
      delete currentQuery.view;
    }
    
    void router.replace(
      { pathname: router.pathname, query: currentQuery },
      undefined,
      { shallow: true }
    );
  };

  // Keep tab in sync with URL changes
  useEffect(() => {
    if (router.query.wave || isApp) return;
    
    const newTab: TabOption = router.query.view === "messages" ? "messages" : "waves";
    if (activeTab !== newTab) {
      setActiveTab(newTab);
    }
  }, [router.query.view, activeTab, router.query.wave, isApp]);

  // In app, just show waves without tabs
  if (isApp) {
    return (
      <div className={containerClassName} style={mobileWavesViewStyle} ref={scrollContainerRef}>
        <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
      </div>
    );
  }
  
  // In browser small layouts, include the tabs
  return (
    <div className={containerClassName} style={mobileWavesViewStyle} ref={scrollContainerRef}>
      <div className="tw-mb-4">
        <TabToggle
          options={[
            { key: "waves", label: "Waves" },
            { key: "messages", label: "Messages" },
          ]}
          activeKey={activeTab}
          onSelect={handleTabChange}
        />
      </div>
      
      {activeTab === "waves" ? (
        <BrainLeftSidebarWaves scrollContainerRef={scrollContainerRef} />
      ) : (
        <DirectMessagesList scrollContainerRef={scrollContainerRef} />
      )}
    </div>
  );
};

export default BrainMobileWaves;
