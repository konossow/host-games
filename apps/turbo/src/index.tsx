import {mediaUrl} from "@host/shared";
import React, {FunctionComponent, useEffect, useState} from 'react';
import {createRoot} from "react-dom/client";
import './index.css';


const banger = new Audio(mediaUrl("turbo/sounds/banger.mp3"));
banger.loop = true;
const clock = new Audio(mediaUrl("turbo/sounds/clock.mp3"));
clock.loop = true;
const drum = new Audio(mediaUrl("turbo/sounds/drum.mp3"));
drum.loop = true;
const heartbeat = new Audio(mediaUrl("turbo/sounds/heartbeat.mp3"));
heartbeat.loop = true;

const Turbo: FunctionComponent = () => {
  const random = () => Math.floor(Math.random() * 100);
  const [time, setTime] = useState<number>(random());
  const sounds = [banger, clock, drum, heartbeat];
  
  const pause = () => {
    sounds.forEach(s => s.pause());
  }
  
  const play = (sound: HTMLAudioElement) => {
    pause();
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', (e) => play(sounds[parseFloat(e.key) - 1]));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTime(random()), 10);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
      <div className="turbo">
        00:00:{pad(time)}
      </div>
  );
};

const root = createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(<Turbo/>);

