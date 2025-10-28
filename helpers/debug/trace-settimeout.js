(() => {
  if (window.__traceSetTimeout) return;

  const original = window.setTimeout;

  window.setTimeout = function patchedTimeout(handler, delay, ...rest) {
    const stack = new Error().stack;

    const wrapped = (...cbArgs) => {
      const start = performance.now();
      try {
        return typeof handler === "function"
          ? handler.apply(this, cbArgs)
          : eval(handler);
      } finally {
        const duration = performance.now() - start;
        if (duration > 50) {
          console.warn("[setTimeout violation]", {
            duration,
            stack,
          });
        }
      }
    };

    return original.call(this, wrapped, delay, ...rest);
  };

  window.__traceSetTimeout = true;
})();
