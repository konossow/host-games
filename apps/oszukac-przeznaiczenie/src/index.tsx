import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {insertCoin} from "playroomkit";
import App from './App';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

insertCoin({
    gameId: "osNQqOGk48BOBntzAe12",
    roomCode: 'HOST',
    skipLobby: true,
    reconnectGracePeriod: 1000 * 60
}).then(()=> (
    root.render(
        <React.StrictMode>
            <App canBeHost={localStorage.getItem('host') !== null}/>
        </React.StrictMode>
    )
));
