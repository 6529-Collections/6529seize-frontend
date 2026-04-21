"use client";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DynamicHeadTitle() {
  const { title } = useTitle();
  const pathname = usePathname();
  const shouldApplyDefaultTitle = pathname === "/" && title === DEFAULT_TITLE;

  useEffect(() => {
    if (!document.title || title !== DEFAULT_TITLE || shouldApplyDefaultTitle) {
      document.title = title;
    }
  }, [shouldApplyDefaultTitle, title]);

  return null;
}
