import { ReactNode } from "react";
import { createBreakpoint } from "react-use";
import MessagesMobile from "./MessagesMobile";
import MessagesDesktop from "./MessagesDesktop";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function MessagesBrain({ children }: { readonly children: ReactNode }) {
  const breakpoint = useBreakpoint();

  return breakpoint === "S" ? (
    <MessagesMobile>{children}</MessagesMobile>
  ) : (
    <MessagesDesktop>{children}</MessagesDesktop>
  );
}