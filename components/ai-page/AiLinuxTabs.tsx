"use client";

import type { ComponentProps } from "react";

import { useVisitorPlatform } from "@/components/validator-page/useVisitorPlatform";
import type { VisitorPlatform } from "@/lib/validator-page/detectSystem";
import AiTabs from "./AiTabs";

/**
 * The Linux downloads' CPU switch. It opens on the visitor's CPU as the
 * hero's button does: the server's guess from the User-Agent, refined in
 * Chromium by its client hints, until the person picks a tab.
 */
export default function AiLinuxTabs({
  platform,
  ...tabs
}: Omit<ComponentProps<typeof AiTabs>, "initial"> & {
  readonly platform: VisitorPlatform;
}) {
  const visitor = useVisitorPlatform(platform);
  const initial =
    visitor.system === "linux" && visitor.cpu === "arm64" ? "arm64" : "x64";
  return <AiTabs {...tabs} initial={initial} />;
}
