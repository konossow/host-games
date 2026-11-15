import React, {FunctionComponent} from 'react';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock} from "@fortawesome/free-regular-svg-icons";
import {useConfig} from "../../hooks/useConfig";
import type {MsRiddle} from "@host/shared";


interface RiddleProps {
  time: number;
  riddle?: MsRiddle;
  revealAnswers: boolean;
  countdown: boolean;
}
const Riddle: FunctionComponent<RiddleProps> = ({
  time,
  riddle,
  revealAnswers,
  countdown
}) => {
  const {SOLVING_TIME} = useConfig();
  const formatHint = (solution: string) => {
    const showLetters = time < SOLVING_TIME / 3;
    return solution
      .split(' ')
      .map(word => {
        return word
          .split('')
          .map((char, index, word) => {
            if (!/\p{L}|\p{N}/u.test(char)) {
              return char;
            }
            if (showLetters && word.length > 1 && index === 0) {
              return char;
            }
            return '_';
          })
          .join(' ');
      })
      .join('   ');
  }

  const solvingUnavailable = time === 0 || !countdown;

  if (!riddle) {
    return null;
  }

  return (
    <div className="riddle">
      <img src={riddle.imageUrl} alt=""/>
      <div
        className={`riddle-cover ${!revealAnswers && solvingUnavailable ? 'visible' : ''}`}>
        <FontAwesomeIcon icon={faClock}/>
        <span>{time === 0 ? 'CZAS MINĄŁ!' : 'GRA WSTRZYMANA'}</span>
        <span>POCZEKAJ NA {time === 0 ? 'KOLEJNĄ RUNDĘ' : 'KONTYNUACJĘ GRY'}</span>
      </div>
      <div className={`riddle-cover ${revealAnswers ? 'visible reveal' : ''}`}>
        <span>{riddle.answer}</span>
      </div>
      <div
        className={`riddle-cover ${countdown && time > 0 && time < SOLVING_TIME / 3 * 2 ? 'visible reveal' : ''}`}>
        <span>{formatHint(riddle.answer)}</span>
      </div>
    </div>
  );
};

export default Riddle;
