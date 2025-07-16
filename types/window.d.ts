export {};

declare global {
  interface Window {
    __deepLinkHandled?: boolean;
    __pushLaunchHandled?: boolean;
  }
}
