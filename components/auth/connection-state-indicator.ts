export type ConnectionProfileState =
  | "disconnected"
  | "authorized_only"
  | "authorized_connected";

interface ConnectionProfileIndicator {
  state: ConnectionProfileState;
  avatarClassName: string;
  overlayClassName: string;
  buttonClassName: string;
  title: string;
}

export function getConnectionProfileIndicator({
  isAuthenticated,
  isConnected,
}: {
  readonly isAuthenticated: boolean;
  readonly isConnected: boolean;
}): ConnectionProfileIndicator {
  if (!isAuthenticated) {
    return {
      state: "disconnected",
      avatarClassName: `tw-bg-iron-900 tw-ring-2 tw-ring-inset tw-ring-white/10`,
      overlayClassName: "",
      buttonClassName:
        "tw-border-white/20 tw-bg-iron-900 tw-ring-2 tw-ring-inset tw-ring-white/10",
      title: "Disconnected",
    };
  }

  if (isConnected) {
    return {
      state: "authorized_connected",
      avatarClassName: `tw-bg-emerald-900/10 tw-ring-2 tw-ring-emerald-700/30`,
      overlayClassName: "tw-bg-emerald-950/10",
      buttonClassName:
        "tw-border-emerald-700/25 tw-bg-emerald-900/10 tw-ring-2 tw-ring-inset tw-ring-emerald-800/25",
      title: "Authorized and Connected",
    };
  }

  return {
    state: "authorized_only",
    avatarClassName: `tw-bg-amber-900/10 tw-ring-2 tw-ring-amber-700/30`,
    overlayClassName: "tw-bg-amber-950/10",
    buttonClassName:
      "tw-border-amber-700/25 tw-bg-amber-900/10 tw-ring-2 tw-ring-inset tw-ring-amber-800/25",
    title: "Authorized only (wallet not connected)",
  };
}
