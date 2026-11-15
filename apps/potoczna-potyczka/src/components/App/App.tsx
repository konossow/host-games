import React, {FunctionComponent} from 'react';
import {useIsHost} from "playroomkit";
import Host from "../Host/Host";
import Stream from '../Stream/Stream';
import { onDisconnect} from "playroomkit";

const App: FunctionComponent = () => {
  const isHost = useIsHost();

  if (isHost) {
    return <Host/>;
  }
  return <Stream/>;
};

export default App;
