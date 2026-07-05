"use client";

import type { FC, ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

interface EditingDropContextValue {
  readonly editingDropId: string | null;
  readonly setEditingDropId: (dropId: string | null) => void;
}

const EditingDropContext = createContext<EditingDropContextValue | undefined>(
  undefined
);

export const EditingDropProvider: FC<{ readonly children: ReactNode }> = ({
  children,
}) => {
  const [editingDropId, setEditingDropId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ editingDropId, setEditingDropId }),
    [editingDropId]
  );

  return (
    <EditingDropContext.Provider value={value}>
      {children}
    </EditingDropContext.Provider>
  );
};

export const useEditingDrop = (): EditingDropContextValue => {
  const context = useContext(EditingDropContext);
  if (context === undefined) {
    throw new Error(
      "useEditingDrop must be used within an EditingDropProvider"
    );
  }
  return context;
};
