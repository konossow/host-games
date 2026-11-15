import React, {FunctionComponent} from 'react';
import './Mainstream.css';
import {isStreamScreen, useIsHost} from "playroomkit";
import Player from '../Player/Player';
import Host from "../Host/Host";
import Stream from '../Stream/Stream';

const Mainstream: FunctionComponent = () => {
  const isHost = useIsHost();
  if (isHost) {
    return <Host/>;
  }
  if (isStreamScreen()) {
    return <Stream/>;
  } else {
    return <Player/>;
  }
};

export default Mainstream;
