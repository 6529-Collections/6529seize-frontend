"use client";

import dynamic from "next/dynamic";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PhoneListLayoutProvider,
  useLayout,
} from "@/components/brain/my-stream/layout/LayoutContext";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import HeaderPlaceholder from "@/components/header/HeaderPlaceholder";
import PullToRefresh from "@/components/providers/PullToRefresh";
import { PhoneNavigationScreenContext } from "@/contexts/PhoneNavigationScreenContext";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import {
  phoneScreenDepth,
  type PhoneListScreen as ListScreen,
  type PhoneScreen as Screen,
  type PhoneNavigationRoute,
} from "@/helpers/waves/phone-navigation-route";
import { PULL_TO_REFRESH_TRANSFORM_ROOT_ATTRIBUTE } from "@/helpers/pull-to-refresh.helpers";
import { createPhoneNavigationMotion } from "@/lib/motion/phone-navigation";
import {
  registerPhoneNavigationMotion,
  type PhoneNavigationMotion,
} from "@/lib/motion/phone-navigation-registry";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { useEditingDrop } from "@/contexts/EditingDropContext";

const AppHeader = dynamic(() => import("@/components/header/AppHeader"), {
  ssr: false,
  loading: () => <HeaderPlaceholder />,
});
const MessagesLayout = dynamic(
  () => import("@/components/messages/layout/MessagesLayout")
);
const WavesLayout = dynamic(
  () => import("@/components/waves/layout/WavesLayout")
);
const EncryptedMessages = dynamic(() =>
  import("@/components/e2ee/list/E2eeConversationListPage").then(
    (module) => module.E2eeConversationListPage
  )
);

function getListPathname(screen: ListScreen) {
  if (screen === "encrypted") return getEncryptedMessagesRoute();
  return screen === "messages" ? "/messages" : "/waves";
}

function ListContent({ screen }: { readonly screen: ListScreen }) {
  if (screen === "messages" || screen === "encrypted")
    return (
      <MessagesLayout>
        {screen === "encrypted" ? <EncryptedMessages /> : null}
      </MessagesLayout>
    );
  return <WavesLayout>{null}</WavesLayout>;
}

function ListPage({
  screen,
  active,
}: {
  readonly screen: ListScreen;
  readonly active: boolean;
}) {
  const { registerRef } = useLayout();
  const header = useRef<HTMLDivElement | null>(null);
  const content = useRef<HTMLDivElement | null>(null);
  const currentSearchParams = useSearchParams();
  const { isVisible: keyboardVisible } = useNativeKeyboard();
  const { editingDropId } = useEditingDrop();
  const defaultSearch = screen === "feed" ? "view=profile-feed" : "";
  const registerHeader = useCallback(
    (element: HTMLDivElement | null) => {
      header.current = element;
      registerRef("header", element);
    },
    [registerRef]
  );
  const route = useMemo(
    () => ({
      pathname: getListPathname(screen),
      searchParams: active
        ? currentSearchParams
        : new ReadonlyURLSearchParams(defaultSearch),
      active,
    }),
    [active, currentSearchParams, defaultSearch, screen]
  );
  return (
    <PhoneNavigationScreenContext.Provider value={route}>
      {active && <PullToRefresh contentRef={content} triggerZoneRef={header} />}
      <div
        ref={content}
        {...{ [PULL_TO_REFRESH_TRANSFORM_ROOT_ATTRIBUTE]: "true" }}
      >
        <div ref={registerHeader}>
          <AppHeader />
        </div>
        <main>
          <ListContent screen={screen} />
        </main>
      </div>
      <BottomNavigation
        paused={!active}
        hidden={
          active &&
          (keyboardVisible ||
            currentSearchParams.has("drop") ||
            editingDropId !== null)
        }
      />
    </PhoneNavigationScreenContext.Provider>
  );
}

/** A bounded native stack: lists retain their DOM, scrollports and local state. */
export default function PhoneNavigationStack({
  route,
  children,
}: {
  readonly route: PhoneNavigationRoute;
  readonly children: ReactNode;
}) {
  const elements = useRef(new Map<Screen, HTMLDivElement>());
  const current = useRef(route);
  const previous = useRef<Screen | null>(null);
  const motion = useRef<PhoneNavigationMotion | null>(null);
  const [retained, setRetained] = useState<readonly ListScreen[]>([
    route.family,
  ]);
  const required =
    route.screen === "conversation" ? route.destination : route.screen;
  const screens =
    required && !retained.includes(required)
      ? [...retained, required]
      : retained;
  // A new underlay must mount in the same commit as its entering page.
  if (screens !== retained) setRetained(screens);
  useLayoutEffect(() => {
    const controller = createPhoneNavigationMotion(() => {
      const active = current.current;
      const page = elements.current.get(active.screen);
      const destination = active.destination
        ? elements.current.get(active.destination)
        : null;
      const dim = destination?.querySelector<HTMLElement>(
        ":scope > [data-phone-navigation-dim]"
      );
      return page && destination && dim ? { page, destination, dim } : null;
    });
    motion.current = controller;
    return registerPhoneNavigationMotion(controller);
  }, []);
  useLayoutEffect(() => {
    current.current = route;
    if (previous.current !== route.screen) {
      motion.current?.commit(
        previous.current !== null &&
          phoneScreenDepth(route.screen) > phoneScreenDepth(previous.current)
      );
      previous.current = route.screen;
    }
  }, [route]);

  return (
    <div
      className="tw-relative tw-isolate tw-min-h-[var(--layout-viewport-height,100dvh)] tw-overflow-x-clip tw-bg-[#0d0d0e]"
      data-phone-navigation-stack
    >
      {screens.map((screen) => {
        const active = route.screen === screen;
        return (
          <div
            key={screen}
            ref={(element) => {
              if (element) elements.current.set(screen, element);
              else elements.current.delete(screen);
            }}
            data-phone-navigation-screen={screen}
            aria-hidden={!active}
            inert={!active}
            className={`${active ? "tw-relative" : "tw-invisible tw-absolute tw-inset-0 tw-opacity-0"} tw-bg-[#0d0d0e]`}
          >
            <PhoneListLayoutProvider active={active}>
              <ListPage screen={screen} active={active} />
            </PhoneListLayoutProvider>
            <div
              data-phone-navigation-dim
              aria-hidden="true"
              className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-black tw-opacity-0"
            />
          </div>
        );
      })}
      {route.screen === "conversation" && (
        <div
          ref={(element) => {
            if (element) elements.current.set("conversation", element);
            else elements.current.delete("conversation");
          }}
          data-phone-navigation-screen="conversation"
          className="tw-relative tw-bg-[#0d0d0e]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
