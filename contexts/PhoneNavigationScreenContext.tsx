"use client";

import { createContext, useContext } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

/** A retained list keeps its own route and stops background-only work. */
interface PhoneNavigationScreen {
  readonly pathname: string;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly active: boolean;
}

export const PhoneNavigationScreenContext =
  createContext<PhoneNavigationScreen | null>(null);

export function usePhoneNavigationScreen() {
  return useContext(PhoneNavigationScreenContext);
}

export function usePhoneNavigationScreenActive() {
  return usePhoneNavigationScreen()?.active ?? true;
}
