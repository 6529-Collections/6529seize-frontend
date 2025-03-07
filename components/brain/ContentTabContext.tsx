import React, { createContext, useState, useContext, ReactNode } from 'react';
import { MyStreamWaveTab } from './my-stream/MyStreamWave';

interface ContentTabContextType {
  activeContentTab: string;
  setActiveContentTab: (tab: string) => void;
}

// Create the context with a default value
const ContentTabContext = createContext<ContentTabContextType>({
  activeContentTab: MyStreamWaveTab.CHAT,
  setActiveContentTab: () => {},
});

// Export a provider component
export const ContentTabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeContentTab, setActiveContentTab] = useState<string>(MyStreamWaveTab.CHAT);

  return (
    <ContentTabContext.Provider value={{ activeContentTab, setActiveContentTab }}>
      {children}
    </ContentTabContext.Provider>
  );
};

// Export a hook for using the context
export const useContentTab = () => useContext(ContentTabContext);