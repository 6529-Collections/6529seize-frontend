"use client";

import { useTitle } from "@/contexts/TitleContext";
import { useEffect } from "react";

export default function DynamicHeadTitle() {
  const { title } = useTitle();

  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
