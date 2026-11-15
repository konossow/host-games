import {mediaUrl} from "@host/shared";
import { FunctionComponent, useEffect } from "react";
import Team from "../../model/Team";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";

const errorSound = new Audio(mediaUrl("potoczna-potyczka/sounds/error.mp3"));
const TeamInfo: FunctionComponent<Team> = (props) => {
  useEffect(() => {
    if (props.errors > 0) {
      errorSound.play();
    }
  }, [props.errors])
  return (
    <div className="team-info">
      <div className="name">{props.name}</div>
      <div className="score">{props.score}</div>
      <div className="erros">
        <FontAwesomeIcon className={`error ${props.errors > 0 ? 'active' : ''}`} icon={faTimes}/>
        <FontAwesomeIcon className={`error ${props.errors > 1 ? 'active' : ''}`} icon={faTimes}/>
        <FontAwesomeIcon className={`error ${props.errors > 2 ? 'active' : ''}`} icon={faTimes}/>
      </div>
    </div>
  );
}
export default TeamInfo;
