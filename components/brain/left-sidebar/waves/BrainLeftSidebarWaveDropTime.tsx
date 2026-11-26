"use client";

import { useTimeAgoShort } from "@/hooks/useDisplayTimeZone";
import { usePageVisible, useVisibleInterval } from "@/hooks/usePageVisibility";
import React, { useEffect, useState } from "react";

interface BrainLeftSidebarWaveDropTimeProps {
  readonly time: number;
}

const BrainLeftSidebarWaveDropTime: React.FC<
  BrainLeftSidebarWaveDropTimeProps
> = ({ time }) => {
  const timeAgoShort = useTimeAgoShort();
  const [now, setNow] = useState(() => Date.now());
  const visible = usePageVisible();

  useVisibleInterval(() => setNow(Date.now()), 60_000);

  useEffect(() => {
    if (!visible) return;

    const handleFocus = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };

    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, [visible]);

  const label = timeAgoShort(time, now);

  return <span>{label}</span>;
};

export default BrainLeftSidebarWaveDropTime;
