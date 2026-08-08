import type { Mode, PageShareTarget, SubMode } from "./constants";
import type {
  ConnectionShareStatus,
  TerminalConnectionShareStatus,
} from "./shareUtils";

type MutableRef<T> = { current: T };

export interface HeaderShareModalViewProps {
  readonly shouldRender: boolean;
  readonly isVisible: boolean;
  readonly onClose: () => void;
  readonly dialogRef: MutableRef<HTMLDialogElement | null>;
  readonly mode: Mode;
  readonly activeSubTab: SubMode;
  readonly setActiveSubTab: (subTab: SubMode) => void;
  readonly navigateBrowserSrc: string;
  readonly navigateBrowserUrl: string;
  readonly navigateAppSrc: string;
  readonly navigateAppUrl: string;
  readonly navigateCoreUrl: string;
  readonly pageShareTarget: PageShareTarget;
  readonly setPageShareTarget: (target: PageShareTarget) => void;
  readonly shareConnectionSrc: string;
  readonly shareConnectionAppUrl: string;
  readonly shareConnectionCoreUrl: string;
  readonly mobileConnectionShareStatus: ConnectionShareStatus;
  readonly desktopConnectionShareStatus: ConnectionShareStatus;
  readonly terminalConnectionShareFailuresRef: MutableRef<
    Map<string, TerminalConnectionShareStatus>
  >;
  readonly requestSessionUpgrade: (() => Promise<unknown>) | undefined;
  readonly urlCopied: boolean;
  readonly setUrlCopied: (copied: boolean) => void;
  readonly isMobile: boolean;
  readonly isElectron: boolean;
}
