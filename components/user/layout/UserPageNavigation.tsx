"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
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
  const [pendingTab, setPendingTab] = useOptimistic<UserPageTabKey | null>(
    null
  );

  const navigate = (href: string, tab: UserPageTabKey) => {
    startTransition(() => {
      setPendingTab(tab);
      router.push(href, { scroll: false });
    });
  };

  return (
    <UserPageNavigationContext
      value={{ pendingTab: isPending ? pendingTab : null, navigate }}
    >
      {children}
    </UserPageNavigationContext>
  );
}
