import { useEffect } from "react";

import { useRef } from "react";

function useWhyDidYouUpdate<T extends object>(name: string, props: T): void {
  const previousProps = useRef<T | null>(null);

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({...previousProps.current, ...props}) as Array<keyof T>;
      const changesObj: Partial<Record<keyof T, { from: any; to: any }>> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj);
      }
    }

    previousProps.current = {...props};
  });
}
