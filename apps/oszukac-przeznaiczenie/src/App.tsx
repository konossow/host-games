import {mediaUrl} from "@host/shared";
import React, {FunctionComponent, useEffect, useMemo, useState} from "react";
import "./App.css";
import {
    myPlayer,
    resetPlayersStates,
    useIsHost,
    useMultiplayerState,
    usePlayersList,
    usePlayerState
} from "playroomkit";
import Error from './Error';
import Player from "./Player";
import {randomNumBetween} from "./utils";
import {Api} from "./api";

const loadingScenarioPlaceholders = [
    'Wasz kres nadchodzi... powoli.',
    'Analizuję Waszą bezwartościową egzystencję...',
    'Los wybiera narzędzie Waszego końca...',
    'Symuluję Wasz koniec... cierpliwości.',
    'Wybieram sposób, w jaki się skompromitujecie.',
    'Generuję Wasz żałosny test na przetrwanie...',
    'Jeszcze chwila i poznacie swoje przeznaczenie. Nie ma powodu do radości.',
    'Proces losowania katastrofy trwa... oczywiście, to niczego nie zmieni.',
    'Ustalanie, jak tym razem Was unicestwić.'
];
const waitingForPlayersPlaceholders = [
    'Czekam na ofiary... znaczy, graczy.',
    'Jeszcze kilku śmiałków musi się zgłosić do eksterminacji.',
    'Zbieram nieświadomych kandydatów na porażkę.',
    'Oczekuję mięsa armatniego do testów.',
    'Gracze jeszcze nie wiedzą, że przyszli tu zginąć.',
    'Ładuję arenę... i desperatów.'
];


const backgroundSound = new Audio(mediaUrl("oszukac-przeznaiczenie/sounds/background.mp3"));
backgroundSound.volume = .5;
backgroundSound.loop = true;
const scenarioSound = new Audio(mediaUrl("oszukac-przeznaiczenie/sounds/scenario.mp3"));

interface AppProps {
    // tylko przeglądarka z flagą host w localStorage może prowadzić grę (dawniej: obecność api_key)
    canBeHost: boolean;
}
const App: FunctionComponent<AppProps> = ({canBeHost}) => {
    const api = useMemo(() => new Api(), []);
    const players = usePlayersList(true);
    const me = myPlayer();
    const isHost = useIsHost();
    const [currentScenario, setCurrentScenario] = useMultiplayerState<string>('scenario', '');
    const sp = new URLSearchParams(window.location.search);
    const [name, setName] = useState('');
    const [playerName, setPlayerName] = usePlayerState(me, 'name', sp.get('player'));
    const [strategy, setStrategy] = useState('');
    const [playerStrategy, setPlayerStrategy] = usePlayerState(me, 'strategy', '');
    usePlayerState(me, 'loading', false);
    usePlayerState(me, 'score', 0);
    usePlayerState(me, 'fate', '');

    const waitingForPlayersPlaceholder = useMemo(() => waitingForPlayersPlaceholders[randomNumBetween(0, waitingForPlayersPlaceholders.length - 1)], [currentScenario]);
    const loadingScenarioPlaceholder = useMemo(() => loadingScenarioPlaceholders[randomNumBetween(0, loadingScenarioPlaceholders.length - 1)], [currentScenario]);
    
    const [backgroundSoundPlaying, setBackgroundSoundPlaying] = useState<boolean>(false);

    useEffect(() => {
        if (isHost) {
            document.addEventListener('click', () => {
                if (!backgroundSoundPlaying) {
                    backgroundSound.play();
                    setBackgroundSoundPlaying(true);
                }
            })
        }
    }, [isHost]);

    useEffect(() => {
        if (!isHost) return;

        players.forEach(player => {
            const strategy = player.getState('strategy');
            const loading = player.getState('loading');
            const hasFate = !!player.getState('fate');
            const ready = !!strategy && !loading && !hasFate

            if (ready) {
                player.setState('loading', true);

                const fetchFate = async () => {
                    try {
                        const {fate, score} = await api.getFate(player.getState('name'), strategy);
                        player.setState('score', score);
                        player.setState('fate', fate);
                        player.setState('loading', false);
                    } catch (err) {
                        fetchFate();
                    }
                };

                fetchFate(); // initial call
            }
        });
    }, [players]);

    useEffect(() => {
        setStrategy('');
    }, [currentScenario]);

    const createNewScenario = async () => {
        setCurrentScenario('');
        resetPlayersStates(['name']);
        setCurrentScenario(await api.getScenario());
        scenarioSound.play();
    }

    if (!isHost) {
        if (!playerName) {
            return (
                <div className="strategy-box">
                    <label htmlFor="name">Twój nędzny identyfikator</label>
                    <textarea
                        rows={8}
                        value={name}
                        placeholder="Co ma być na twoim nagrobku?"
                        id="name"
                        onChange={e => setName(e.target.value)}
                    />
                    <a className={!name ? 'disabled' : ''} onClick={() => setPlayerName(name)}>Wkrocz w nicość</a>
                </div>
            )
        }
        if (me.getState('fate')) {
            return (
                <Player player={me} presentationMode/>
            )
        }
        const placeholder = !currentScenario ? loadingScenarioPlaceholders[randomNumBetween(0, loadingScenarioPlaceholders.length - 1)] : 'Wpisz tu swoją desperacką próbę przeżycia...';
        return (
            <div className="strategy-box">
                {currentScenario ? <h3>{currentScenario}</h3> : null}
                <label htmlFor="strategy">Twoje żałosne wypociny</label>
                <textarea
                    rows={8}
                    value={strategy}
                    placeholder={placeholder}
                    id="strategy"
                    className={!currentScenario || playerStrategy ? 'disabled' : ''}
                    onChange={e => setStrategy(e.target.value)}
                />
                <div style={{textAlign: 'right'}}>
                    {strategy.length} / 140
                </div>
                <a className={!currentScenario || playerStrategy || !strategy || strategy.length > 140 ? 'disabled' : ''}
                   onClick={() => setPlayerStrategy(strategy)}>podpisz swój wyrok</a>
            </div>
        )
    }

    if (!canBeHost) {
        return <Error/>;
    }

    return (
        <div className="app">
            <div className="scenario">
                <h1 onClick={createNewScenario}>
                    {currentScenario || (players.length === 1 ? waitingForPlayersPlaceholder : loadingScenarioPlaceholder)}
                </h1>
            </div>
            <div className="players">
                {players.map(player => player.id !== me.id ? (
                    <Player key={player.id} player={player}/>
                ) : null)}
            </div>
            <img className="qr" src={mediaUrl("oszukac-przeznaiczenie/images/qr.png")} contentEditable tabIndex={1}/>
        </div>
    );
};
export default App;