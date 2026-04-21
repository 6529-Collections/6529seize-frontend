"use client";

import React, { useEffect, useState } from "react";
import { getTimeAgoShort } from "@/helpers/Helpers";

interface BrainLeftSidebarWaveDropTimeProps {
  readonly time: number;
}

const BrainLeftSidebarWaveDropTime: React.FC<
  BrainLeftSidebarWaveDropTimeProps
> = ({ time }) => {
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

  const label = getTimeAgoShort(time, now);

  return <span className="tw-text-iron-300">{label}</span>;
};

export default BrainLeftSidebarWaveDropTime;
