/**
 * Opens the 6529 Desktop connect choice from the shared connect flow. The
 * flow passes how to open WalletConnect for this request; the dialog calls
 * it if the user picks WalletConnect.
 */

type OpenWalletConnect = () => Promise<void>;

let openWalletConnect: OpenWalletConnect | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export function openDesktopConnectDialog(open: OpenWalletConnect): void {
  openWalletConnect = open;
  notify();
}

export function closeDesktopConnectDialog(): void {
  if (openWalletConnect === null) return;
  openWalletConnect = null;
  notify();
}

export const getDesktopConnectDialogOpener = (): OpenWalletConnect | null =>
  openWalletConnect;

export const getServerDesktopConnectDialogOpener =
  (): OpenWalletConnect | null => null;

export function subscribeDesktopConnectDialog(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
