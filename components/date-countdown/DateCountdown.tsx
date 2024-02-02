import { useState, useEffect } from "react";

interface Props {
  title: string;
  date: Date;
}

export default function DateCountdown(props: Readonly<Props>) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = Date.now();
    const difference = props.date.getTime() - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    let remaining = difference;

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    remaining -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    remaining -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(remaining / (1000 * 60));
    remaining -= minutes * (1000 * 60);

    const seconds = Math.floor(remaining / 1000);

    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    let timeoutId: any;
    function tick() {
      setTimeLeft(calculateTimeLeft());
      scheduleNextTick();
    }

    function scheduleNextTick() {
      const now = Date.now();
      const msUntilNextSecond = 1000 - (now % 1000);
      timeoutId = setTimeout(tick, msUntilNextSecond); // Assign the identifier to the variable
    }

    scheduleNextTick();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [props.date]);

  return (
    <span className={"d-flex flex-column"}>
      <span className="d-flex justify-content-between align-items-center">
        {props.title}
      </span>
      <span className="pt-2 font-larger font-bolder">
        {timeLeft.days > 0 && (
          <>
            {timeLeft.days.toLocaleString()} day{timeLeft.days !== 1 ? "s" : ""}
            ,{" "}
          </>
        )}
        {timeLeft.hours > 0 && (
          <>
            {timeLeft.hours} hour{timeLeft.hours !== 1 ? "s" : ""},{" "}
          </>
        )}
        {timeLeft.minutes > 0 && (
          <>
            {timeLeft.minutes} minute{timeLeft.minutes !== 1 ? "s" : ""} and{" "}
          </>
        )}
        {timeLeft.seconds} second
        {timeLeft.seconds !== 1 ? "s" : ""}
      </span>
    </span>
  );
}
