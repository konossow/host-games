import {mediaUrl} from "@host/shared";
import Riddle from "../Riddle/Riddle";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Timer from "../Timer/Timer";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect, useState} from "react";
import {myPlayer, useMultiplayerState, usePlayersList} from "playroomkit";
import {useConfig} from "../../hooks/useConfig";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import {defaultGameState} from "../../model/GameState";

const backgroundSound = new Audio(mediaUrl("mainstream/sounds/jazz.mp3"));
backgroundSound.loop = true;
const Stream = () => {
  const {SOLVING_TIME} = useConfig();
  const players = usePlayersList(true);
  const me = myPlayer();
  const [{countdown, riddles, revealAnswers, riddleIndex, finished}] = useMultiplayerState('gameState', defaultGameState);
  const [time] = useMultiplayerState<number>('time', SOLVING_TIME);
  const [backgroundSoundPlaying, setBackgroundSoundPlaying] = useState<boolean>(false);

  useEffect(() => {
    document.addEventListener('click', () => {
      if (!backgroundSoundPlaying) {
        backgroundSound.play();
        setBackgroundSoundPlaying(true);
      }
    })
  }, []);

  if (!finished) {
    return (
      <div className="app-container">
        <Riddle time={time} riddle={riddles[riddleIndex]} revealAnswers={revealAnswers} countdown={countdown}/>
        <div className="right-panel">
          {revealAnswers ? null : <Timer time={time} countdown={countdown}/>}
          <div className="players">
            {players
              .filter(p => p.id !== me.id)
              .map(player => ({
                answer: (player.getState('answers') || [])[riddleIndex],
                timestamp: (player.getState('timestamps') || [])[riddleIndex],
                name: player.getState('name'),
                player
              }))
              .sort((p1, p2) => (p1.timestamp || SOLVING_TIME) - (p2.timestamp || SOLVING_TIME))
              .map(p => (
                p.name ? (
                  <div className="player">
                    <span className="name" onClick={() => p.player.kick()}>{p.name}</span>
                    <div className="hints">
                      {p.answer && p.timestamp && p.timestamp > SOLVING_TIME / 3 ?
                        <FontAwesomeIcon icon={faCircleQuestion}/> : null}
                      {p.answer && p.timestamp && p.timestamp > SOLVING_TIME / 3 * 2 ?
                        <FontAwesomeIcon icon={faCircleQuestion}/> : null}
                      {!p.answer && (time === 0 || countdown || revealAnswers) ?
                        <FontAwesomeIcon icon={faTimes} className="error"/> : null}
                    </div>
                    {p.answer && p.timestamp ? <span className="timestamp">{p.timestamp / 1000}</span> : null}
                    {revealAnswers && p.answer ? <span className="answer">{p.answer}</span> : null}
                  </div>
                ) : null
              ))
            }
          </div>
          <div className="riddle-counter">
            <span>{riddleIndex + 1} / {riddles.length}</span>
          </div>
        </div>
        {!revealAnswers ? <img className="qr" src={mediaUrl("mainstream/images/qr.png")} contentEditable tabIndex={1}/> : null}
      </div>
    );
  }

  return (
    <div className="game-over">
      {!revealAnswers ? (
        <>
          <div>KONIEC GRY</div>
          <div>50 PKT ZA PRAWIDŁOWĄ ODPOWIEDŹ</div>
          <div>+10 PKT ZA KAŻDĄ ZACHOWANĄ PODPOWIEDŹ</div>
        </>
      ) : (
        <>
          <div>DZIĘKUJĘ ZA GRĘ</div>
          {/*<div>ZAPRASZAM NA 5 MINUT PRZERWY</div>*/}
        </>
      )}
    </div>
  );
}
export default Stream;
