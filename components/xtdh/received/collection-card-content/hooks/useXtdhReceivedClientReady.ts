'use client';

import { useEffect, useState } from "react";

export function useXtdhReceivedClientReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}
