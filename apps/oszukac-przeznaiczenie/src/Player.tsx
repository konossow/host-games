import {mediaUrl} from "@host/shared";
import React, {FunctionComponent, useEffect} from "react";
import "./Player.css";
import {PlayerState} from "playroomkit";

interface PlayerProps {
    player: PlayerState;
    presentationMode?: boolean;
}
const Player: FunctionComponent<PlayerProps> = ({player, presentationMode}) => {
    const loading = player.getState('loading');
    const name = player.getState('name');
    const score = player.getState('score');
    const fate = player.getState('fate');
    const src = fate ? (score < 50 ? 'rip' : 'live') : 'evil-ai';
    
    useEffect(() => {
        if (fate) {
            (new Audio(mediaUrl(`oszukac-przeznaiczenie/sounds/${src}.mp3`))).play();
        }
    }, [fate]);
    
    if (presentationMode) {
        return (
            <div className="player presentation tooltip" data-tooltip={fate}>
                <h1>{score}</h1>
                <div className="image-wrapper">
                    <img src={mediaUrl(`oszukac-przeznaiczenie/images/${src}.png`)} alt={src} className={src}/>
                </div>
            </div>
        )
    }

    return (
        <div className={`player ${loading ? 'loading' : ''} ${fate ? 'tooltip' : ''}`} data-tooltip={fate} onClick={() => player.kick()}>
            <h2>
                {name}
            </h2>
            {fate ? <h1>{score}</h1> : null}
            <div className="image-wrapper">
                <img src={mediaUrl(`oszukac-przeznaiczenie/images/${src}.png`)} alt={src} className={src}/>
                <img src={mediaUrl("oszukac-przeznaiczenie/images/evil-ai.png")} className={fate ? 'glitch-out' : ''} alt="evil-ai"/>
            </div>
        </div>
    )
}
export default Player;