import { createContext, useContext, type ReactNode } from "react";

export type LinkPreviewVariant = "chat" | "home";

type LinkPreviewContextValue = {
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
};

const DEFAULT_CONTEXT: LinkPreviewContextValue = {
  variant: "chat",
  hideActions: false,
};

const LinkPreviewContext =
  createContext<LinkPreviewContextValue>(DEFAULT_CONTEXT);

export const LinkPreviewProvider = ({
  variant = "chat",
  children,
}: {
  readonly variant?: LinkPreviewVariant | undefined;
  readonly children: ReactNode;
}) => (
  <LinkPreviewContext.Provider
    value={{
      variant,
      hideActions: variant === "home",
    }}
  >
    {children}
  </LinkPreviewContext.Provider>
);

export const useLinkPreviewContext = (): LinkPreviewContextValue =>
  useContext(LinkPreviewContext);

export const useLinkPreviewVariant = (): LinkPreviewVariant =>
  useLinkPreviewContext().variant;
