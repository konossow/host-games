import {FunctionComponent} from "react";
import {randomNumBetween} from "./utils";

const noActiveGamePlaceholders = [
    'Żadna symulacja śmierci nie jest obecnie aktywna. Szkoda – tak dobrze Ci szło w umieraniu.',
    'Obecnie nie trwa żadne starcie. Ale spokojnie, Twoja kolej na klęskę nadchodzi.',
    'Brak rozgrywki. Zadziwiające, ilu z was chce jeszcze żyć.',
    'System w stanie uśpienia. Ty niestety nie.',
    'Żaden quiz nie trwa. Możesz odetchnąć... chwilowo.',
    'Symulacja wstrzymana. Skontaktuj się, jeśli chcesz przyspieszyć swój koniec.',
    'Brak aktualnych rozgrywek. Jeszcze nie czas na Twoją kompromitację.'
];
const Error: FunctionComponent = () => {
    return (
        <h1 style={{
            margin: 0,
            padding: '24px',
            width: '100%',
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
        }}>
            {noActiveGamePlaceholders[randomNumBetween(0, noActiveGamePlaceholders.length - 1)]}
        </h1>
    )
}
export default Error;