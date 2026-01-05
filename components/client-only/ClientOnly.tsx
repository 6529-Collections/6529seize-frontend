"use client";

import { useState, useEffect } from "react";

export default function ClientOnly({
  children,
  fallback = null,
}: {
  readonly children: React.ReactNode;
  readonly fallback?: React.ReactNode | undefined;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return <>{fallback}</>;

  return <>{children}</>;
}
