import type Answer from "./Answer";
import {GameTheme} from "./GameTheme";

export default interface Question {
    id: number;
    themes?: GameTheme[];
    description: string;
    answers: Answer[];
}
