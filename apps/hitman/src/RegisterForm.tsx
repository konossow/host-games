import {me, myPlayer, useIsHost, usePlayerState} from "playroomkit";
import { usePlayersList } from "./hooks/usePlayersList";
import React, {FunctionComponent, useState} from "react";
import {Flex, Button, Upload, Input, Image as AntImage, Typography, Card, QRCode, Modal} from 'antd';
import type { GetProp, UploadProps } from 'antd';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCamera, faPlus, faSpinner} from "@fortawesome/free-solid-svg-icons";
const { Text, Title } = Typography;

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const getBase64 = (file: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement("canvas");
            const scale = 600 / img.width;
            canvas.width = 600;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const scaledDataUrl = canvas.toDataURL("image/jpeg", 0.1); // 80% jakości
                callback(scaledDataUrl);
            }
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
};
const RegisterForm = () => {
    console.log('form');
    const me = myPlayer();
    const [name, setName] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [avatar, setAvatar] = useState<string>();

    const beforeUpload = (file: FileType) => {
        setLoading(true);
        getBase64(file, (url) => {
            setAvatar(url);
            console.log(url.length)
            setLoading(false);
        });
        return false; // Zatrzymuje domyślny upload
    };

    const register = () => {
        me.setState('name', name!);
        me.setState('avatar', avatar!);
        // me.setState('avatar', "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiB2aWV3Qm94PSIwIDAgMTI0IDEyNCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMjQiIGhlaWdodD0iMTI0IiByeD0iMjQiIGZpbGw9IiNGOTczMTYiLz4KCjwvc3ZnPg==");
    }

    return (
        <Flex gap="middle" align="stretch" vertical>
            <Upload
                style={{width: '100%', height: 'auto', aspectRatio: '1 / 1'}}
                accept="image/*"
                capture="user"
                name="avatar"
                listType="picture-card"
                showUploadList={false}
                beforeUpload={beforeUpload}
            >
                {avatar ? (
                    <AntImage src={avatar} style={{objectFit: 'cover', aspectRatio: '1 / 1'}}/>
                ) : (
                    <Flex vertical>
                        <Title level={2}>
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCamera} />}
                            <div style={{ marginTop: 8 }}>Zrób selfie</div>
                        </Title> 
                    </Flex>
                )}
            </Upload>
            <Input
                size="large"    
                placeholder="Tu wpisz swoje imię" 
                style={{textAlign: 'center', textTransform: 'uppercase'}} 
                onChange={e => setName(e.target.value)}
            />
            <Button
                disabled={!name || !avatar}
                size="large"
                block
                onClick={register}
            >
                Dołącz do gry
            </Button>
        </Flex>
    )
}
export default RegisterForm;