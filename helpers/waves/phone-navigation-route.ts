import {
  getEncryptedConversationIdFromPathname,
  getEncryptedMessagesRoute,
} from "@/helpers/navigation.helpers";
import {
  isProfileWavesFeed,
  returnsToProfileWavesFeed,
} from "./profile-feed-navigation";

export type PhoneListScreen = "waves" | "feed" | "messages" | "encrypted";
export type PhoneScreen = PhoneListScreen | "conversation";

export interface PhoneNavigationRoute {
  readonly screen: PhoneScreen;
  readonly destination: PhoneListScreen | null;
  readonly family: "waves" | "messages";
}

export function getPhoneNavigationRoute(
  pathname: string,
  search: URLSearchParams,
  waveId: string | null
): PhoneNavigationRoute | null {
  if (getEncryptedConversationIdFromPathname(pathname))
    return {
      screen: "conversation",
      destination: "encrypted",
      family: "messages",
    };
  if (pathname === getEncryptedMessagesRoute())
    return { screen: "encrypted", destination: "messages", family: "messages" };
  const isConversationFamily =
    pathname === "/waves" ||
    pathname.startsWith("/waves/") ||
    pathname === "/messages" ||
    pathname.startsWith("/messages/");
  if (waveId && isConversationFamily) {
    const family = pathname.startsWith("/messages") ? "messages" : "waves";
    let destination: PhoneListScreen = "waves";
    if (family === "messages") destination = "messages";
    else if (returnsToProfileWavesFeed(search)) destination = "feed";
    return { screen: "conversation", destination, family };
  }
  if (isProfileWavesFeed(pathname, search))
    return { screen: "feed", destination: "waves", family: "waves" };
  if (
    pathname === "/waves" &&
    (!search.has("view") || search.get("view") === "waves")
  )
    return { screen: "waves", destination: null, family: "waves" };
  if (pathname === "/messages")
    return { screen: "messages", destination: null, family: "messages" };
  return null;
}

export function phoneScreenDepth(screen: PhoneScreen) {
  if (screen === "conversation") return 2;
  return screen === "feed" || screen === "encrypted" ? 1 : 0;
}
