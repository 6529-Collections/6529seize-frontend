"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";
import type { UserPageTabKey } from "./userTabs.config";

type ProfileNavigation = {
  readonly pendingTab: UserPageTabKey | null;
  readonly navigate: (href: string, tab: UserPageTabKey) => void;
};

const UserPageNavigationContext = createContext<ProfileNavigation | null>(null);

export const useUserPageNavigation = () =>
  useContext(UserPageNavigationContext);

export default function UserPageNavigation({
  children,
}: {
  readonly children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Optimistic state updates immediately and resets when navigation settles.
  const [pendingTab, setPendingTab] = useOptimistic<UserPageTabKey | null>(
    null
  );

  const navigate = useCallback(
    (href: string, tab: UserPageTabKey) => {
      startTransition(() => {
        setPendingTab(tab);
        router.push(href, { scroll: false });
      });
    },
    [router, setPendingTab, startTransition]
  );
  const value = useMemo(
    () => ({ pendingTab: isPending ? pendingTab : null, navigate }),
    [isPending, pendingTab, navigate]
  );

  return (
    <UserPageNavigationContext value={value}>
      {children}
    </UserPageNavigationContext>
  );
}
