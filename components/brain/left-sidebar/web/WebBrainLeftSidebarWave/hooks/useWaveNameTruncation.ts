import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

interface UseWaveNameTruncationOptions {
  readonly collapsed: boolean;
  readonly contentKey: string;
}

interface UseWaveNameTruncationResult {
  readonly isNameTruncated: boolean;
  readonly nameRef: MutableRefObject<HTMLDivElement | null>;
}

export const useWaveNameTruncation = ({
  collapsed,
  contentKey,
}: UseWaveNameTruncationOptions): UseWaveNameTruncationResult => {
  const nameRef = useRef<HTMLDivElement>(null);
  const [isNameTruncated, setIsNameTruncated] = useState(false);

  const measureTruncation = useEffectEvent(() => {
    const element = nameRef.current;
    if (!element) {
      return;
    }

    setIsNameTruncated(element.scrollWidth > element.clientWidth);
  });

  useEffect(() => {
    if (collapsed) {
      setIsNameTruncated(false);
      return;
    }

    const element = nameRef.current;
    if (!element) {
      return;
    }

    measureTruncation();

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        measureTruncation();
      });
      resizeObserver.observe(element);
    }

    window.addEventListener('resize', measureTruncation);

    return () => {
      window.removeEventListener('resize', measureTruncation);
      resizeObserver?.disconnect();
    };
  }, [collapsed, contentKey, measureTruncation]);

  return {
    isNameTruncated,
    nameRef,
  };
};
