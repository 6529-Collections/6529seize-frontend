"use client";

import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getWalletAddress } from "@/services/auth/auth.utils";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "./DocumentationControls";

export function useDocumentationActor() {
  const auth = useAuth();
  const { address } = useSeizeConnectContext();
  const authenticatedAddress = getWalletAddress() ?? address;
  return {
    ...auth,
    actorKey: `${auth.connectedProfile?.id ?? "anonymous"}:${auth.activeProfileProxy?.id ?? "direct"}:${authenticatedAddress?.toLowerCase() ?? "none"}`,
  };
}

export default function DocumentationAuthGate({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { connectedProfile, fetchingProfile, requestAuth, actorKey } =
    useDocumentationActor();
  const { msg } = useDocumentationMessages();
  const queryClient = useQueryClient();
  useEffect(
    () => () => {
      void queryClient.cancelQueries({ queryKey: ["artwork-documentation"] });
      queryClient.removeQueries({ queryKey: ["artwork-documentation"] });
    },
    [actorKey, queryClient]
  );
  if (fetchingProfile && !connectedProfile?.id)
    return <DocumentationNotice>{msg("loading")}</DocumentationNotice>;
  if (!connectedProfile?.id)
    return (
      <div className="tw-space-y-4">
        <DocumentationNotice>{msg("signIn")}</DocumentationNotice>
        <DocumentationButton
          onClick={() => {
            void requestAuth();
          }}
        >
          {msg("connect")}
        </DocumentationButton>
      </div>
    );
  return (
    <div key={actorKey} className="ph-no-capture" data-sentry-mask>
      {children}
    </div>
  );
}
