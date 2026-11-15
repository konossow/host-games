import React, {FunctionComponent, useState} from "react";
import "./Player.css";
import {myPlayer, useMultiplayerState, usePlayersList} from "playroomkit";
import {Button, Card, Image, Modal, Result, Select, Typography} from "antd";
import {useQuests} from "./hooks/useQuests";
import { Challenger } from "./model/Challenger";

const { Text, Title } = Typography;

const Player: FunctionComponent = () => {
    const players = usePlayersList(true);
    const [challengers, setChallengers] = useMultiplayerState<Challenger[]>('challengers', []);
    const meIndex = challengers.findIndex(challenger => challenger.name === myPlayer().getProfile().name); // TODO: replace getProfile with getState, replace challangers with playerList (with flag: eliminated) and state
    const me = meIndex > -1 ? challengers[meIndex] : undefined;
    const target = challengers[(meIndex + 1) % challengers.length];
    const [exposeTarget, setExposeTarget] = useState<string>();
    const [rerolls, setRerolls] = useState(Math.ceil(players.length / 10));
    const [isModalVisible, setModalVisible] = useState(false);
    const getNewQuest = useQuests();
    
    if (challengers.length === 0) {
        return (
            <Result title="Poczekaj na rozpoczęcie gry"/>
        )
    }

    if (!me) {
        return (
            <Result 
                status="error" 
                title="Wyeliminowano Cię!"
            />
        )
    }

    if (target.name === me.name) {
        return (
            <Result status="success" title="Wygrałeś!"/>
        )
    }
    
    const eliminate = (name: string) => {
        const eliminatedIndex = challengers.findIndex(c => c.name === name);
        if (eliminatedIndex === -1) return;

        const updated = [...challengers];

        const hitmanIndex = (eliminatedIndex === 0 ? updated.length : eliminatedIndex) - 1;

        updated[hitmanIndex].quest = updated[eliminatedIndex].quest;
        // update[hitmanIndex].canReroll = true;
        updated.splice(eliminatedIndex, 1);

        setChallengers(updated);
        
        if (name !== me.name) {
            // increment score
        }
    }
    
    const reroll = () => {
        const updated = [...challengers];
        const newQuest = getNewQuest();
        if (!newQuest) {
            // brak zadania: pula się wyczerpała (właśnie została zresetowana) albo zadania
            // jeszcze nie pobrały się z Supabase. Dawna pętla while zawieszała tu kartę.
            return;
        }
        updated[meIndex].quest = newQuest;
        setChallengers(updated);
        setRerolls(rerolls - 1);
    }

    const confirmExpose = () => {
        if (
            challengers.findIndex((c) => c.name === exposeTarget) ===
            (meIndex === 0 ? challengers.length : meIndex) - 1
        ) {
            eliminate(exposeTarget!);
        } else {
            eliminate(me.name);
        }
        setModalVisible(false);
    };

    return (
        <div className="player">
            <Card title="Twój cel" size="small">
                <Image
                    width={200}
                    src={target.avatar}
                />
                <Text strong>{target.name}</Text>
            </Card>
            <Title level={3}>{me.quest}</Title>
            <Button size="large" block disabled={!rerolls} onClick={() => reroll()}>{`Wymień zadanie (${rerolls})`}</Button>
            <Button size="large" block onClick={() => setModalVisible(true)}>Zdemaskuj</Button>
            <Button size="large" block danger onClick={() => eliminate(me.name)}>Zostałem wyeliminowany</Button>
            <Modal
                title="Zdemaskuj swojego hitmana"
                open={isModalVisible}
                onOk={confirmExpose}
                onCancel={() => setModalVisible(false)}
                okText="Jestem pewien"
                cancelText="Muszę się upewnić"
                okButtonProps={{ disabled: !exposeTarget, danger: true }}
            >
                <div className="expose-modal">
                    <Text>
                        Jeśli odkryłeś tożsamość osoby, która ma Cię na celowniku możesz ją wyeliminować
                    </Text>
                    <Select
                        style={{ width: "100%", marginTop: 8, marginBottom: 8 }}
                        value={exposeTarget}
                        placeholder="Wybierz gracza"
                        onChange={setExposeTarget}
                    >
                        {players.map((p) => (
                            <Select.Option value={p.getProfile().name} key={p.id}>
                                {p.getProfile().name}
                            </Select.Option>
                        ))}
                    </Select>
                    <Text underline>Jeśli się mylisz to TY zostaniesz wyeliminowany</Text>
                </div>
            </Modal>
        </div>
    )
}
export default Player;