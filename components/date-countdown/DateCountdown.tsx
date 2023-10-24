import { Col, Container, Row } from "react-bootstrap";
import styles from "./DateCountdown.module.scss";
import { useState, useEffect } from "react";

interface Props {
  title: string;
  date: number;
}

export default function DateCountdown(props: Props) {
  const targetDate = new Date(props.date);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const difference = targetDate.getTime() - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <span className="d-flex flex-column">
      <span>{props.title}:</span>
      <span className="font-larger font-bolder">
        {timeLeft.days > 0 && (
          <>
            {timeLeft.days} day{timeLeft.days !== 1 ? "s" : ""},{" "}
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
