"use client";

import { useState, useEffect } from "react";

export default function ClientOnly({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return <>{children}</>;
}
