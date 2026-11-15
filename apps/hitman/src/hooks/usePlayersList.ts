import {usePlayersList as usePlayersListBase} from "playroomkit";
import {PlayerState} from "../model/PlayerState";

export const usePlayersList = () => {
    return usePlayersListBase(true) as PlayerState[];
}