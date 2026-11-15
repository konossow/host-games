import type {MsRiddle} from "@host/shared";
import {useConfig} from "../hooks/useConfig";

export interface GameState {
  seed?: string;
  started: boolean;
  finished: boolean;
  countdown: boolean;
  totalRounds: number;
  // losowane przez hosta z Supabase (ms_get_riddles) po zalogowaniu
  riddles: MsRiddle[];
  riddleIndex: number;
  revealAnswers: boolean;
}

const {RIDDLES_LENGTH} = useConfig();

export const defaultGameState: GameState = {
  started: false,
  finished: false,
  totalRounds: RIDDLES_LENGTH,
  countdown: false,
  revealAnswers: false,
  riddles: [],
  riddleIndex: 0
}
