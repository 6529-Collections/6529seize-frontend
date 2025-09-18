import { ReactNode } from "react";
import MessagesMobile from "./MessagesMobile";
import MessagesDesktop from "./MessagesDesktop";
import useDeviceInfo from "../../hooks/useDeviceInfo";

export default function MessagesBrain({ children }: { readonly children: ReactNode }) {
  const { isApp } = useDeviceInfo();

  return isApp ? (
    <MessagesMobile>{children}</MessagesMobile>
  ) : (
    <MessagesDesktop>{children}</MessagesDesktop>
  );
}