import Riddle from "../Riddle/Riddle";
import React, {useState} from "react";
import {myPlayer, useMultiplayerState, usePlayerState} from "playroomkit";
import {useConfig} from "../../hooks/useConfig";
import {defaultGameState} from "../../model/GameState";

const Player = () => {
  const {SOLVING_TIME} = useConfig();
  const sp = new URLSearchParams(window.location.search);
  const me = myPlayer();
  const [time] = useMultiplayerState<number>('time', SOLVING_TIME);
  const [{countdown, riddles, revealAnswers, riddleIndex, finished}] = useMultiplayerState('gameState', defaultGameState);
  const [name, setName] = useState('');
  const [playerName, setPlayerName] = usePlayerState(me, 'name', sp.get('player'));
  const [answer, setAnswer] = useState('');
  const [playerAnswers, setPlayerAnswers] = usePlayerState<string[]>(me, 'answers', []);
  const [playerTimestamps, setPlayerTimestamps] = usePlayerState<number[]>(me, 'timestamps', []);
  const timestamp = playerTimestamps[riddleIndex];

  if (!playerName) {
    return (
      <div className="player-view">
        <label htmlFor="name">Jak mam Cię zapowiedzieć?</label>
        <textarea
          rows={8}
          value={name}
          placeholder="Twój pseudonim artystyczny"
          id="name"
          onChange={e => setName(e.target.value)}
        />
        <button disabled={!name} onClick={() => setPlayerName(name)}>Wejdź na scenę</button>
      </div>
    )
  }

  if (finished || revealAnswers) {
    return (
      <div className="riddle-cover visible">
        <span>KONIEC GRY</span>
      </div>
    )
  }
  const solvingUnavailable = time === 0 || time === SOLVING_TIME || !countdown;
  return (
    <div className="player-view">
      <Riddle time={time} riddle={riddles[riddleIndex]} revealAnswers={revealAnswers} countdown={countdown}/>
      <label className={!timestamp ? 'error' : ''} htmlFor="answer">
        {timestamp ? `Udzielono odpowiedzi w ${timestamp / 1000} sekund!` : 'Nie udzielono odpowiedzi!'}
      </label>
      <textarea
        rows={8}
        value={answer}
        placeholder={timestamp ? "Twoja odpowiedź została zapisana, jednak możesz ją nadal zmienić" : "Jaki zespół / artysta muzyczny jest przedstawiony na obrazku?"}
        id="answer"
        onChange={e => setAnswer(e.target.value)}
      />
      <button disabled={solvingUnavailable || !answer} onClick={() => {
        playerAnswers[riddleIndex] = answer;
        setPlayerAnswers(playerAnswers);
        playerTimestamps[riddleIndex] = SOLVING_TIME - time + Math.floor(Math.random() * 1000);
        setPlayerTimestamps(playerTimestamps);
        setAnswer('');
        navigator.vibrate(200);
      }}>{timestamp ? 'ZGŁOŚ KOLEJNĄ ODPOWIEDŹ' : 'ZGŁOŚ SWOJĄ ODPOWIEDŹ'}</button>
    </div>
  )
}
export default Player;
