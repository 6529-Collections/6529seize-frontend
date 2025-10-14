'use client';

import { createBreakpoint } from "react-use";

const useBreakpoint = createBreakpoint({ MD: 768, S: 0 });

export function useXtdhReceivedBreakpoint() {
  return useBreakpoint();
}

export function useXtdhReceivedIsMobile(): boolean {
  return useXtdhReceivedBreakpoint() === "S";
}
