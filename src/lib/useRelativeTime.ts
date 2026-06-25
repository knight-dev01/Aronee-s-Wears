import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { formatRelativeTime } from './time';

export function useRelativeTime(date: Date | Timestamp | string | number | undefined | null) {
  const [formatted, setFormatted] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    // Update immediately if date changes
    setFormatted(formatRelativeTime(date));

    // Set up a timer to refresh every minute
    // (or more frequently for "seconds ago" precision)
    const interval = setInterval(() => {
      setFormatted(formatRelativeTime(date));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [date]);

  return formatted;
}
