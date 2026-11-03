"use client";

import { useEffect, useState } from "react";
import HomeWhatIsNetworkState from "./what-is/HomeWhatIsNetworkState";
import HomeWhatIsOperator from "./what-is/HomeWhatIsOperator";
import HomeWhatIsPeopleAndAgents from "./what-is/HomeWhatIsPeopleAndAgents";

// Three candidate directions for the section, for the owner to choose from.
// Outside production builds, `/?whatIs=a|b|c` previews a direction; the
// switch and the unchosen directions go once one is picked.
const DIRECTIONS = {
  a: HomeWhatIsOperator,
  b: HomeWhatIsPeopleAndAgents,
  c: HomeWhatIsNetworkState,
} as const;

type Direction = keyof typeof DIRECTIONS;

const DEFAULT_DIRECTION: Direction = "a";

function isDirection(value: string | null): value is Direction {
  return value !== null && Object.hasOwn(DIRECTIONS, value);
}

function usePreviewDirection(): Direction {
  const [direction, setDirection] = useState<Direction>(DEFAULT_DIRECTION);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    const requested = new URLSearchParams(window.location.search).get("whatIs");
    if (isDirection(requested)) {
      setDirection(requested);
    }
  }, []);
  return direction;
}

export default function HomeWhatIs6529() {
  const Section = DIRECTIONS[usePreviewDirection()];
  return <Section />;
}
