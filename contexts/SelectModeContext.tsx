"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface SelectModeContextType {
  isSelectMode: boolean;
  toggleSelectMode: () => void;
}

const SelectModeContext = createContext<SelectModeContextType | undefined>(undefined);

export const SelectModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSelectMode, setIsSelectMode] = useState(false);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    isSelectMode,
    toggleSelectMode
  }), [isSelectMode, toggleSelectMode]);

  return (
    <SelectModeContext.Provider value={value}>
      {children}
    </SelectModeContext.Provider>
  );
};

export const useSelectMode = () => {
  const context = useContext(SelectModeContext);
  if (!context) {
    throw new Error('useSelectMode must be used within a SelectModeProvider');
  }
  return context;
};