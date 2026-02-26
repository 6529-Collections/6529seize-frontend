import { createContext, type ReactNode, useContext, useMemo } from "react";

export type LinkPreviewVariant = "chat" | "home";

export type LinkPreviewToggleControl = {
  readonly canToggle: boolean;
  readonly isHidden: boolean;
  readonly isLoading: boolean;
  readonly label: string;
  readonly onToggle: () => void;
};

export type LinkPreviewInlineShowControl = {
  readonly enabled: boolean;
  readonly isLoading: boolean;
  readonly onToggle: () => void;
  readonly label: string;
};

type LinkPreviewContextValue = {
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
  readonly previewToggle?: LinkPreviewToggleControl | undefined;
  readonly inlineShowControl?: LinkPreviewInlineShowControl | undefined;
};

const DEFAULT_CONTEXT: LinkPreviewContextValue = {
  variant: "chat",
  hideActions: false,
};

const LinkPreviewContext =
  createContext<LinkPreviewContextValue>(DEFAULT_CONTEXT);

export const LinkPreviewProvider = ({
  variant = "chat",
  previewToggle,
  inlineShowControl,
  children,
}: {
  readonly variant?: LinkPreviewVariant | undefined;
  readonly previewToggle?: LinkPreviewToggleControl | undefined;
  readonly inlineShowControl?: LinkPreviewInlineShowControl | undefined;
  readonly children: ReactNode;
}) => {
  const value = useMemo(
    () => ({
      variant,
      hideActions: variant === "home",
      previewToggle,
      inlineShowControl,
    }),
    [variant, previewToggle, inlineShowControl]
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
