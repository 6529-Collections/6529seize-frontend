import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectModeContextType {
  isSelectMode: boolean;
  toggleSelectMode: () => void;
}

const SelectModeContext = createContext<SelectModeContextType | undefined>(undefined);

export const SelectModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSelectMode, setIsSelectMode] = useState(false);

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
  };

  return (
    <SelectModeContext.Provider value={{ isSelectMode, toggleSelectMode }}>
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