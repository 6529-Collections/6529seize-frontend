import { createContext, useContext, useMemo, type ReactNode } from "react";

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
}) => {
  const value = useMemo(
    () => ({
      variant,
      hideActions: variant === "home",
    }),
    [variant]
  );

  return (
    <LinkPreviewContext.Provider value={value}>
      {children}
    </LinkPreviewContext.Provider>
  );
};

export const useLinkPreviewContext = (): LinkPreviewContextValue =>
  useContext(LinkPreviewContext);

export const useLinkPreviewVariant = (): LinkPreviewVariant =>
  useLinkPreviewContext().variant;
