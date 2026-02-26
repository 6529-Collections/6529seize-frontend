"use client";

import { useEffect } from "react";

import { DEFAULT_TITLE, useTitle } from "@/contexts/TitleContext";

export default function DynamicHeadTitle() {
  const { title } = useTitle();

  useEffect(() => {
    if (!document.title || title !== DEFAULT_TITLE) {
      document.title = title;
    }
  }, [title]);

  return null;
}
