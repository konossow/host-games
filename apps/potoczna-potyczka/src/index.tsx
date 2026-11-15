import React from 'react';
import {createRoot} from "react-dom/client";
import './index.css';
import {insertCoin} from "playroomkit";
import App from './components/App/App';
import { PromptProvider } from './hooks/usePrompt';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);
insertCoin({
  gameId: "j9LokelhfZaqoxPjfBws",
  roomCode: 'POPO',
  skipLobby: true,
  streamMode: true,
  reconnectGracePeriod: 1000 * 60 * 5
}).then(()=> (
  root.render(
    <PromptProvider>
      <App />
    </PromptProvider>
  )
))
