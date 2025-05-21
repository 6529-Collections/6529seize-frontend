import React, { useRef, useState, useEffect } from "react";
import BrainLeftSidebarWaves from "../left-sidebar/waves/BrainLeftSidebarWaves";
import DirectMessagesList from "../direct-messages/DirectMessagesList";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { TabToggle } from "../../common/TabToggle";
import { useRouter } from "next/router";

type TabOption = "waves" | "messages";

const BrainMobileWaves: React.FC = () => {
  const { mobileWavesViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const containerClassName = "tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 " +
    "tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 " +
    "tw-space-y-4 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-pt-2";

  const [activeTab, setActiveTab] = useState<TabOption>(() => 
    router.query.view === "messages" ? "messages" : "waves"
  );

  useEffect(() => {
    if (router.query.wave) return;
    
    const newTab: TabOption = router.query.view === "messages" ? "messages" : "waves";
    if (activeTab !== newTab) {
      setActiveTab(newTab);
    }
  }, [router.query.view, activeTab, router.query.wave]);

  const handleTabChange = (key: string): void => {
    if (key !== "waves" && key !== "messages") return;
    
    const tab = key as TabOption;
    setActiveTab(tab);
    
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

  const tabOptions = [
    { key: "waves", label: "Waves" },
    { key: "messages", label: "Messages" },
  ];

  return (
    <div 
      className={containerClassName} 
      style={mobileWavesViewStyle} 
      ref={scrollContainerRef}
    >
      <div className="tw-mb-4">
        <TabToggle
          options={tabOptions}
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
