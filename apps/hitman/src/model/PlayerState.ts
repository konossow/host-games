import {PlayerState as PlayerStateBase} from "playroomkit";
import {Challenger} from "./Challenger";
export interface PlayerState extends PlayerStateBase {
    getState<T extends Challenger[keyof Challenger]>(key: keyof Challenger): T;
    setState(key: keyof Challenger, value: Challenger[keyof Challenger], reliable?: boolean): void;
}