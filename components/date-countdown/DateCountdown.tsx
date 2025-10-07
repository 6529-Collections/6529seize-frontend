"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./DateCountdown.module.scss";

interface Props {
  title?: string;
  date?: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function DateCountdown(props: Readonly<Props>) {
  const { title, date } = props;

  // Only consider the widget "ready" when BOTH title and date have arrived.
  const isReady = Boolean(title && date);

  // Calculate time left without re-creating the function each render.
  const calcTimeLeft = useMemo(() => {
    return (): TimeLeft | null => {
      if (!date) return null;

      const diff = date.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      let remaining = diff;

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      remaining -= days * (1000 * 60 * 60 * 24);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      remaining -= hours * (1000 * 60 * 60);

      const minutes = Math.floor(remaining / (1000 * 60));
      remaining -= minutes * (1000 * 60);

      const seconds = Math.floor(remaining / 1000);

      return { days, hours, minutes, seconds };
    };
  }, [date]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reset state whenever date changes (or becomes unavailable)
    setTimeLeft(calcTimeLeft());

    // If no date yet, don't schedule ticks
    if (!date) return;

    const tick = () => {
      const next = calcTimeLeft();
      setTimeLeft(next);

      // Stop ticking at zero
      if (
        !next ||
        (next.days === 0 &&
          next.hours === 0 &&
          next.minutes === 0 &&
          next.seconds === 0)
      ) {
        timerRef.current && clearTimeout(timerRef.current);
        timerRef.current = null;
        return;
      }

      // Align to the next second boundary
      const now = Date.now();
      const msUntilNextSecond = 1000 - (now % 1000);
      timerRef.current = setTimeout(tick, msUntilNextSecond);
    };

    // Schedule first tick aligned to next second
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);
    timerRef.current = setTimeout(tick, msUntilNextSecond);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [date, calcTimeLeft]);

  const plural = (n: number, word: string) =>
    `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

  return (
    <div className="d-flex flex-column">
      {/* Title */}
      {isReady ? (
        <div>{title}</div>
      ) : (
        <div
          className={`${styles.skeletonText} ${styles.skeletonTitle}`}
          aria-hidden="true">
          &nbsp;
        </div>
      )}

      {/* Countdown */}
      <div className="pt-2 font-larger font-bolder" aria-live="polite">
        {isReady && timeLeft ? (
          <>
            {timeLeft.days > 0 && <>{plural(timeLeft.days, "day")}, </>}
            {timeLeft.hours > 0 && <>{plural(timeLeft.hours, "hour")}, </>}
            {timeLeft.minutes > 0 && (
              <>{plural(timeLeft.minutes, "minute")} and </>
            )}
            {plural(timeLeft.seconds, "second")}
          </>
        ) : (
          <div
            className={`${styles.skeletonText} ${styles.skeletonCountdown}`}
            aria-hidden="true">
            &nbsp;
          </div>
        )}
      </div>
    </div>
  );
}
