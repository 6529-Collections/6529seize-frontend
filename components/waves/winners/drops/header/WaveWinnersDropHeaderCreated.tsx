import { useEffect, useState } from "react";
import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";
import { Time } from "../../../../../helpers/time";

interface WaveWinnersDropHeaderCreatedProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderCreated({
  winner,
}: WaveWinnersDropHeaderCreatedProps) {
  const [isMobile, setIsMobile] = useState(false);

  function checkMobile() {
    const screenSize = window.innerWidth;
    if (screenSize <= 640) { // Tailwind's sm breakpoint
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <span className="tw-text-xs tw-font-medium tw-text-iron-400 tw-leading-none">
      {isMobile 
        ? Time.millis(winner.drop.created_at).toLocaleDropDateString()
        : Time.millis(winner.drop.created_at).toLocaleDropDateAndTimeString()
      }
    </span>
  );
}
