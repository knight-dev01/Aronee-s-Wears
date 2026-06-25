import React from 'react';
import { useRelativeTime } from '../lib/useRelativeTime';

interface RelativeTimeProps {
  date: any;
  className?: string;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({ date, className }) => {
  const time = useRelativeTime(date);
  return <span className={className}>{time}</span>;
};
