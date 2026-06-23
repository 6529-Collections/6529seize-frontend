"use client";

import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import { useEffect } from "react";

export default function MobileLaunchTimingReporter() {
  useEffect(() => {
    markMobileLaunchStep("root_layout_reporter_mounted");
  }, []);

  return null;
}
