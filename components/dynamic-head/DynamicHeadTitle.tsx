"use client";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";
import { useEffect } from "react";

export default function DynamicHeadTitle() {
  const { title } = useTitle();

  useEffect(() => {
    if (!document.title || title !== DEFAULT_TITLE) {
      document.title = title;
    }
  }, [title]);

  return null;
}
