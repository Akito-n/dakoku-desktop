import { useState, useEffect } from "react";

interface UseCurrentTimeOptions {
  updateInterval?: number;
  format?: "full" | "time-only" | "date-only";
}

interface CurrentTime {
  formatted: string;
  date: Date;
  timeString: string;
  dateString: string;
}

export const useCurrentTime = (
  options: UseCurrentTimeOptions = {},
): CurrentTime => {
  const { updateInterval = 1000, format = "full" } = options;

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  const formatTime = (date: Date): CurrentTime => {
    const timeString = date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const dateString = date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });

    let formatted: string;
    switch (format) {
      case "time-only":
        formatted = timeString;
        break;
      case "date-only":
        formatted = dateString;
        break;
      // case "full":
      default:
        formatted = `${dateString} ${timeString}`;
        break;
    }

    return {
      formatted,
      date,
      timeString,
      dateString,
    };
  };

  return formatTime(currentTime);
};
