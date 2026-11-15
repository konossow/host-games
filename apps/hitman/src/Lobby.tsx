import {me, useIsHost, usePlayersList} from "playroomkit";
import React, {FunctionComponent, useMemo} from "react"
import {Button, Card, Col, Flex, Image, Modal, QRCode, Row, Typography} from 'antd';
import RegisterForm from "./RegisterForm";

const { Title } = Typography;

interface LobbyProps {
    onStart: () => void;
}
const Lobby: FunctionComponent<LobbyProps> = ({
    onStart    
}) => {
    const players = usePlayersList(true);
    console.log(players);
    const isHost = useIsHost();
    const registerForm = useMemo(() => <RegisterForm/>, []);
    
    if (!me().getState('name')) {
        return registerForm;
    }
    
    return (
        <Row gutter={[16, 16]}>
            {players.map(p => (
                <Col span={6} key={p.id}>
                    <Flex vertical align="center" gap="middle">
                        <Image src={p.getState('avatar')}/>
                        <Title level={5}>{p.getState('name')}</Title>
                    </Flex>
                </Col>
            ))}
            <Col span={24}>
                <Button
                    disabled={!isHost}
                    size="large"
                    block
                    onClick={onStart}
                >
                    {isHost ? 'Rozpocznij grę' : 'Poczekaj na rozpoczęcie gry'}
                </Button>
            </Col>
            <Col span={24}>
                <Button
                    size="large"
                    block
                    onClick={() => Modal.info({
                        title: 'This is a notification message',
                        content: (
                            <QRCode value={window.location.href} />
                        ),
                        onOk() {},
                    })}
                >
                    Zaproś do gry
                </Button>
            </Col>
        </Row>
    )
}
export default Lobby;