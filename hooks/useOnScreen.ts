import { useState, useEffect, RefObject } from 'react';

function useOnScreen<T extends Element>(
  ref: RefObject<T>,
  rootMargin: string = '0px'
): boolean {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      {
        rootMargin,
      }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [ref, rootMargin]);

  return isIntersecting;
}

export default useOnScreen;
