import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {insertCoin} from "playroomkit";
import App from './App';
import { ConfigProvider } from 'antd';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

insertCoin({
    gameId: "h2Y0DvE6bfVxG8Op9zSf",
    roomCode: 'HOST',
    skipLobby: true,
    reconnectGracePeriod: (() => {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay.getTime() - now.getTime();
    })()
}).then(()=> (
    root.render(
        <React.StrictMode>
            <ConfigProvider
                theme={{
                    token: {
                        colorTextBase: '#24292E',
                    },
                }}
            >
                <App/>
            </ConfigProvider>
        </React.StrictMode>
    )
));
