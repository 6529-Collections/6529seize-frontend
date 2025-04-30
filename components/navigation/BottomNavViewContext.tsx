import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export type ViewKey = 'waves' | 'messages'; // extend as needed

interface BottomNavViewContextType {
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
}

const BottomNavViewContext = createContext<BottomNavViewContextType | undefined>(undefined);

export const BottomNavViewProvider: React.FC<{ readonly children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewKey>('waves');

  const contextValue = useMemo(() => ({
    activeView,
    setActiveView,
  }), [activeView, setActiveView]);

  return (
    <BottomNavViewContext.Provider value={contextValue}>
      {children}
    </BottomNavViewContext.Provider>
  );
};

export const useBottomNavView = (): BottomNavViewContextType => {
  const context = useContext(BottomNavViewContext);
  if (!context) {
    throw new Error('useBottomNavView must be used within a BottomNavViewProvider');
  }
  return context;
}; 