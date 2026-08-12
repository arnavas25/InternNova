import { useEffect, useState } from 'react';

export default function useCountdown(targetDateStr) {
  const [remaining, setRemaining] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const target = new Date(targetDateStr).getTime();
    const tick = () => {
      const distance = target - Date.now();
      if (distance < 0) { setDone(true); return; }
      setRemaining({
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);

  return { remaining, done };
}
