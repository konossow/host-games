import React, {FunctionComponent, useEffect, useState} from "react";
import {useMultiplayerState} from "playroomkit";
import {usePrompt} from "../../hooks/usePrompt";
import {mainstreamApi, markSeen} from "@host/shared";
import {useConfig} from "../../hooks/useConfig";
import {defaultGameState, GameState} from "../../model/GameState";

const Host: FunctionComponent = () => {
  const {SOLVING_TIME, SEED_NAME, THEMES, RIDDLES_LENGTH} = useConfig();
  const prompt = usePrompt();
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [gameState, setGameState] = useMultiplayerState('gameState', defaultGameState);
  const [time, setTime] = useMultiplayerState<number>('time', SOLVING_TIME);
  const {finished, countdown, revealAnswers, riddleIndex, riddles} = gameState;

  const updateGameState = (update: Partial<GameState>) => {
    setGameState({...gameState, ...update});
  }


  // po zalogowaniu host losuje zagadki z Supabase (tylko raz - stan jest współdzielony przez playroom)
  useEffect(() => {
    if (authorized && riddles.length === 0) {
      mainstreamApi.getRiddles({seed: SEED_NAME, count: RIDDLES_LENGTH, themes: THEMES})
        .then(riddles => updateGameState({riddles, seed: SEED_NAME}));
    }
  }, [authorized]);

  useEffect( () => {
    const checkPassword = async () => {
      while (true) {
        const password = await prompt();
        if (password === '2274') {
          setAuthorized(true);
          break;
        }
      }
    };

    checkPassword();
  }, []);

  useEffect(() => {
    const countDown = () => {
      setTime(Math.max(time - 1000, 0));
    }

    let timer: ReturnType<typeof setTimeout>;

    if (time > 0 && countdown) {
      if (time === SOLVING_TIME) {
        setTime(time - 1);
      }
      timer = setTimeout(countDown, 1000);
    } else {
      updateGameState({countdown: false});
    }
    return () => clearTimeout(timer);
  }, [time, countdown]);

  if (!authorized) {
    return null;
  }

  const onPause = () => updateGameState({countdown: false});
  const onResume = () => updateGameState({countdown: true});
  const onNext = () => {
    onPause();
    setTime(SOLVING_TIME);
    updateGameState({riddleIndex: gameState.riddleIndex + 1});
  }
  const onPrevious = () => {
    onPause();
    setTime(SOLVING_TIME);
    updateGameState({riddleIndex: gameState.riddleIndex - 1});
  }

  const onReveal = () => {
    updateGameState({
      revealAnswers: true,
      finished: false,
      riddleIndex: 0
    });
  }

  const onFinished = () => {
    // zapamiętaj pokazane zagadki, żeby seed nie dostał ich w kolejnym quizie
    markSeen('mainstream', gameState.seed, riddles.map(r => r.id));
    updateGameState({
      countdown: false,
      finished: true
    });
  }

  return (
    <div className="host">
      <button disabled={finished || revealAnswers || countdown || time === 0} onClick={onResume}>Wznów</button>
      <button disabled={finished || revealAnswers || !countdown} onClick={onPause}>Pauza</button>
      <button disabled={finished || countdown || riddleIndex === riddles.length - 1} onClick={onNext}>Następny</button>
      <button disabled={finished || countdown || riddleIndex === 0} onClick={onPrevious}>Poprzedni</button>
      <button disabled={!finished || revealAnswers} onClick={onReveal}>Pokaż odpowiedzi</button>
      <button disabled={finished} onClick={onFinished}>Koniec gry</button>
      {riddles.length === 0 ? 'Brak zagadek do wylosowania' : riddles.map(r => r.answer).join(', ')}
    </div>
  )
}
export default Host;
