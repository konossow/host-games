// useQuestManager.ts
import {useCallback, useEffect, useState} from "react";
import {useMultiplayerState} from "playroomkit";
import {hitmanApi} from "@host/shared";

export const useQuests = () => {
    // lista zadań pochodzi z tabeli hm_quests w Supabase (dawniej tablica allQuests w tym pliku)
    const [allQuests, setAllQuests] = useState<string[]>([]);
    const [usedQuests, setUsedQuests] = useMultiplayerState<string[]>("usedQuests", []);

    useEffect(() => {
        hitmanApi.getQuests().then(setAllQuests);
    }, []);

    return useCallback((): string | null => {
        const availableQuests = allQuests.filter((quest) => !usedQuests.includes(quest));
        if (availableQuests.length === 0) {
            setUsedQuests([]);
        }
        const quest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
        setUsedQuests([...usedQuests, quest]);
        return quest;
    }, [allQuests, usedQuests, setUsedQuests]);
};
