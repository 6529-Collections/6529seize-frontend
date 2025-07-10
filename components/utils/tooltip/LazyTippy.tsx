"use client";

import Tippy from "@tippyjs/react";
import { forwardRef, useState } from "react";

const LazyTippy = forwardRef((props: any, ref: any) => {
  const [mounted, setMounted] = useState(false);

  const lazyPlugin = {
    fn: () => ({
      onMount: () => setMounted(true),
      onHidden: () => setMounted(false),
    }),
  };

  const computedProps = { ...props };

  computedProps.plugins = [lazyPlugin, ...(props.plugins || [])];

  if (props.render) {
    computedProps.render = (...args: any) =>
      mounted ? props.render(...args) : "";
  } else {
    computedProps.content = mounted ? props.content : "";
  }

  return <Tippy {...computedProps} ref={ref} />;
});

LazyTippy.displayName = "LazyTippy";
export default LazyTippy;
