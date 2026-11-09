"use client";

import { useTimeAgoShort } from "@/hooks/useDisplayTimeZone";
import React, { useEffect, useState } from "react";

interface BrainLeftSidebarWaveDropTimeProps {
  readonly time: number;
}

const BrainLeftSidebarWaveDropTime: React.FC<
  BrainLeftSidebarWaveDropTimeProps
> = ({ time }) => {
  const timeAgoShort = useTimeAgoShort();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
      }
    };

    const handleFocus = () => {
      setNow(Date.now());
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const label = timeAgoShort(time, now);

  return <span>{label}</span>;
};

export default BrainLeftSidebarWaveDropTime;
