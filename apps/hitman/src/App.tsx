import React, {FunctionComponent, useMemo} from "react";
import "./App.css";
import {useMultiplayerState} from "playroomkit";
import Player from "./Player";
import Lobby from "./Lobby";

const App: FunctionComponent= () => {
    const [gameStarted, setGameStarted] = useMultiplayerState('gameStarted', false);
    const lobby = useMemo(() => <Lobby onStart={() => setGameStarted(true)}/>, []);
    if (!gameStarted) {
        return lobby;
    }
    return <Player/>;
};
export default App;