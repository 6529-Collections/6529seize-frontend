"use client";

import { useEffect } from "react";
import useCapacitor from "@/hooks/useCapacitor";

export default function CapacitorSetup() {
  const { isCapacitor } = useCapacitor();
  useEffect(() => {
    if (isCapacitor) {
      document.body.classList.add("capacitor-native");
    } else {
      document.body.classList.remove("capacitor-native");
    }
  }, [isCapacitor]);
  return null;
}
