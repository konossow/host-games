import {mediaUrl} from "@host/shared";
import React, {useEffect, useRef} from "react";
import "./Stream.css";
import {useMultiplayerState} from "playroomkit";
import TeamInfo from "./TeamInfo";
import {defaultGameState} from "../../model/GameState";
import Mainboard from "./Mainboard";
import { getQuestions } from "../../api/getQuestions";
import {updateSeed} from "../../api/updateSeed";
import {TeamSide} from "../../model/Team";

const roundSound = new Audio(mediaUrl("potoczna-potyczka/sounds/round.mp3"));
const correctSound = new Audio(mediaUrl("potoczna-potyczka/sounds/correct.mp3"));
const fullPot = new Audio(mediaUrl("potoczna-potyczka/sounds/mlg-airhorn.mp3"));
const Stream = () => {
  const [gameState, setGameState] = useMultiplayerState('gameState', defaultGameState);
  const prevAnswersRef = useRef(gameState.question?.answers);

  useEffect(() => {
    const prevAnswers = prevAnswersRef.current;
    const currAnswers = gameState.question?.answers;

    // check if any answer became revealed that wasn’t before
    currAnswers?.forEach((ans, i) => {
      if (ans.revealed && !prevAnswers?.[i]?.revealed) {
        correctSound.play();
      }
    });

    // update ref for next render
    prevAnswersRef.current = currAnswers;
  }, [gameState.question?.answers]);

  useEffect(() => {
    if ((gameState.round || 0) > 0) {
      roundSound.play();
    }
  }, [gameState.round]);

  useEffect(() => {
    if (gameState.pot === 100) {
      fullPot.play();
    }
  }, [gameState.pot]);

  useEffect(() => {
    if (gameState.started && gameState.availableQuestions.length === 0) {
      getQuestions(gameState.seed, gameState.mode, gameState.totalRounds, gameState.themes).then(questions => {
        setGameState({
          ...gameState,
          availableQuestions: questions,
          question: questions[0],
          totalRounds: Math.min(gameState.totalRounds, questions.length),
          round: 1
        });
      });
    }
  }, [gameState.started]);

  useEffect(() => {
    if (gameState.finished && gameState.seed !== undefined) {
      updateSeed(gameState.seed, gameState.seenQuestionsIds);
    }
  }, [gameState.finished]);

  const renderToolbar = () => {
    let content = 'Oczekiwanie na graczy';
    if (gameState.started) {
      content = gameState.pot.toString(10);
  }
    if (gameState.finished) {
      content = 'Dziękuję za grę!';
    }
    return (
      <div className="toolbar">
        {content}
      </div>
    )
  }

  return (
    <div className="stream">
      <TeamInfo {...gameState.teamsInfo[TeamSide.LEFT]}/>
      {renderToolbar()}
      <TeamInfo {...gameState.teamsInfo[TeamSide.RIGHT]}/>
      <Mainboard
        {...gameState}
        showRoundCounter={!gameState.scoreLimit}
        started={(gameState.round || 0) > 0}
        leader={gameState.teamsInfo[TeamSide.LEFT].score > gameState.teamsInfo[TeamSide.RIGHT].score ? gameState.teamsInfo[TeamSide.LEFT] : (gameState.teamsInfo[TeamSide.LEFT].score < gameState.teamsInfo[TeamSide.RIGHT].score ? gameState.teamsInfo[TeamSide.RIGHT] : undefined)}/>
    </div>
  );
}
export default Stream;
