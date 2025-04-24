import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SubView = 'waves' | 'messages'; // extend as needed

interface ViewContextType {
  activeSubView: SubView | null;
  setActiveSubView: (view: SubView | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ readonly children: ReactNode }> = ({ children }) => {
  const [activeSubView, setActiveSubView] = useState<SubView | null>(null);

  return (
    <ViewContext.Provider value={{ activeSubView, setActiveSubView }}>
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
