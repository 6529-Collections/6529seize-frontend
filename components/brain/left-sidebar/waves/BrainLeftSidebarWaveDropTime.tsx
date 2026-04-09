"use client";

import React, { useEffect, useEffectEvent, useReducer } from "react";
import { getTimeAgoShort } from "@/helpers/Helpers";

interface BrainLeftSidebarWaveDropTimeProps {
  readonly time: number;
}

const BrainLeftSidebarWaveDropTime: React.FC<
  BrainLeftSidebarWaveDropTimeProps
> = ({ time }) => {
  const [, forceRefresh] = useReducer((value: number) => value + 1, 0);

  const refreshNow = useEffectEvent(() => {
    forceRefresh();
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshNow();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshNow();
      }
    };

    const handleFocus = () => {
      refreshNow();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const label = getTimeAgoShort(time);

  return <span className="tw-text-iron-300">{label}</span>;
};

export default BrainLeftSidebarWaveDropTime;
