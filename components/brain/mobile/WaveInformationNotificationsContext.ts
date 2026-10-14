import { createContext } from "react";

/** Keeps preference controls in the same sheet while About stays mounted. */
export const WaveInformationNotificationsContext = createContext<{
  readonly isOpen: boolean;
  readonly contentId: string;
  readonly container: HTMLDivElement | null;
  readonly open: () => void;
  readonly back: () => void;
} | null>(null);
