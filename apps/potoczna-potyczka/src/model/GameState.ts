import Question from "./Question";
import Team from "./Team";
import {GameMode} from "./GameMode";
import {GameTheme} from "./GameTheme";

export interface GameState {
  mode: GameMode;
  themes: GameTheme[];
  seed?: string;
  pot: number;
  round?: number;
  teamsInfo: Team[];
  question?: Question;
  availableQuestions: Question[];
  seenQuestionsIds: number[];
  totalRounds: number;
  scoreLimit?: number;
  started: boolean;
  finished: boolean;
}

export const defaultGameState: GameState = {
  themes: [],
  mode: GameMode.Classic,
  pot: 0,
  availableQuestions: [],
  seenQuestionsIds: [],
  teamsInfo: [
    {
      errors: 0,
      score: 0,
      name: 'POLEWKA'
    },
    {
      errors: 0,
      score: 0,
      name: 'POPRAWNI'
    }
  ],
  totalRounds: 6,
  started: false,
  finished: false
}
