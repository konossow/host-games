import { FunctionComponent, ReactNode } from "react";
import Question from "../../model/Question";
import {GameMode} from "../../model/GameMode";
import Team from "../../model/Team";

interface MainboardProps {
  question?: Question;
  round?: number;
  totalRounds: number;
  started: boolean;
  finished: boolean;
  mode: GameMode;
  leader?: Team;
  showRoundCounter?: boolean;
}
const Mainboard: FunctionComponent<MainboardProps> = (props) => {
  let content: ReactNode = (
    <div className="game-info">
      <span>Prowadzący ma zawsze rację</span>
      <span>{props.mode === 'quiz' ? '60 sekund na udzielenie odpowiedzi' : `Nie podpowiadamy`}</span>
      <span>{props.mode === 'quiz' ? 'Sprawdzamy odpowiedzi co rundę' : `Nie ma finału ani sucharów`}</span>
    </div>
  );
  if (props.started) {
    content = props.question ? (
      <>
        {props.question.answers.map((answer, i) => (
          <div className={`answer ${answer.revealed ? 'revealed' : ''}`} key={i}>
            <div className="id">
              {i + 1}
            </div>
            <div className="description">
              {answer.description}
            </div>
            <div className="points">
              {answer.points}
            </div>
            <div className="placeholder">
              ............................................................................................................................................................................................................................................................................................................................................................
            </div>
          </div>
        ))}
        {props.showRoundCounter ? (
          <div className="round-counter">
            {props.round || 0} / {props.totalRounds}
          </div>
        ) : null}
      </>
    ) : null;
  }
  if (props.finished) {
    content = (
      <div className="game-info">
        <span>{props.mode === 'quiz' ? 'Zapraszam na 5 minut przerwy' : (props.leader ? `Drużyna ${props.leader.name} zwyciężyła` : 'Remis!')}</span>
      </div>
    );
  }
  return (
    <div className="mainboard">
      {content}
    </div>
  );
}
export default Mainboard;
