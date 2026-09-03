"use client";

import type { ReactNode } from "react";
import { m, useIsPresent, useReducedMotion } from "framer-motion";

const COMPOSER_SURFACE_ENTER_TRANSITION = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
} as const;

const COMPOSER_SURFACE_EXIT_TRANSITION = {
  duration: 0.13,
  ease: [0.4, 0, 1, 1],
} as const;

const COMPOSER_SURFACE_REDUCED_TRANSITION = { duration: 0 } as const;

export default function CreateDropComposerSurface({
  children,
  testId,
}: {
  readonly children: ReactNode;
  readonly testId: string;
}) {
  const isPresent = useIsPresent();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const transition = prefersReducedMotion
    ? COMPOSER_SURFACE_REDUCED_TRANSITION
    : COMPOSER_SURFACE_ENTER_TRANSITION;
  const exitTransition = prefersReducedMotion
    ? COMPOSER_SURFACE_REDUCED_TRANSITION
    : COMPOSER_SURFACE_EXIT_TRANSITION;

  return (
    <m.div
      data-testid={testId}
      data-state={isPresent ? "open" : "closing"}
      aria-hidden={isPresent ? undefined : true}
      inert={isPresent ? undefined : true}
      className="-tw-mx-4 tw-overflow-hidden tw-px-4"
      initial={prefersReducedMotion ? false : { height: 0, opacity: 0.7 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{
        height: 0,
        opacity: prefersReducedMotion ? 1 : 0.7,
        transition: exitTransition,
      }}
      transition={transition}
    >
      {children}
    </m.div>
  );
}
