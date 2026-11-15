import React from 'react';
import {createRoot} from "react-dom/client";
import './index.css';
import {insertCoin} from "playroomkit";
import Mainstream from './components/Mainstream/Mainstream';
import { PromptProvider } from './hooks/usePrompt';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);
insertCoin({
  gameId: "acanFSa0YDDLpXEFrFqV",
  roomCode: 'MAIN',
  skipLobby: true,
  streamMode: true,
  reconnectGracePeriod: 1000 * 60 * 5
}).then(()=> (
  root.render(
    <PromptProvider>
      <Mainstream />
    </PromptProvider>
  )
))
