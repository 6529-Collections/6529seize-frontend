import { useEffect, useState } from 'react';

interface CountdownProps {
  timestamp: number;
}

export default function Countdown({ timestamp }: CountdownProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      const difference = timestamp - now;

      if (difference <= 0) {
        setCountdown('Countdown finished!');
        clearInterval(intervalId);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        let countdown = ''
        if (days === 0) {
          if (hours === 0) {
            if (minutes === 0) {
              countdown = `${seconds} seconds`;
            } else {
              countdown = `${minutes} minutes, ${seconds} seconds`;
            }
          } else {
            countdown = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
          }
        } else {
          countdown = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
        }

        setCountdown(countdown);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timestamp]);

  return <div>{countdown}</div>;
}