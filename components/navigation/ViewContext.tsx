import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ViewKey } from "./navTypes";

interface ViewContextType {
  activeView: ViewKey | null;
  setActiveView: (view: ViewKey | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewKey | null>(null);

  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useViewContext = (): ViewContextType => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViewContext must be used within a ViewProvider');
  }
  return context;
}; 
