import React, {FunctionComponent, useCallback, useEffect, useRef, useState} from 'react';
import {useInterval} from "../../hooks/useInterval";
import {useMultiplayerState} from "playroomkit";
import {useConfig} from "../../hooks/useConfig";

interface TimerProps {
  time: number;
  countdown: boolean;
}
const Timer: FunctionComponent<TimerProps> = ({
  time,
  countdown
}) => {
  const {SOLVING_TIME} = useConfig();
  const [milliseconds, setMilliseconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (countdown && time !== SOLVING_TIME && time !== 0) {
        setMilliseconds(Math.floor(Math.random() * 100));
      } else {
        setMilliseconds(0);
      }
    }, 10);
    return () => clearInterval(timer);
  }, [countdown, time]);

  const formattedTime = () => {
    const seconds = Math.floor(time / 1000);
    const formattedSeconds = seconds.toString().padStart(2, '0');
    const formattedMilliseconds = milliseconds.toString().padStart(2, '0');

    return `${formattedSeconds}:${formattedMilliseconds}`;
  };

  return (
    <div className="timer">
      {formattedTime()}
    </div>
  );
};

export default Timer;
