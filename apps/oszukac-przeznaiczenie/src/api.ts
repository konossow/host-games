import {AiMessage, oszukacPrzeznaiczenieApi} from "@host/shared";

// Rozmowa z Mistrzem Gry. Historia (scenariusz + odpowiedzi graczy) jest trzymana tutaj,
// a prompt systemowy i klucz Groq siedzą w Edge Function "oszukac-przeznaiczenie" (supabase/functions).
export class Api {
    private history: AiMessage[] = [];

    public async getScenario(): Promise<string> {
        this.resetContext();
        this.history.push({role: 'user', content: 'scenario'});

        const content = await oszukacPrzeznaiczenieApi.askAi('scenario', this.history);
        this.history.push({role: 'assistant', content});

        try {
            return JSON.parse(content).scenario;
        } catch (err) {
            throw new Error("Błąd parsowania JSON: " + content);
        }
    }

    public async getFate(player: string, strategy: string): Promise<{ score: number, fate: string }> {
        this.history.push({role: 'user', content: JSON.stringify({player, strategy})});

        const content = await oszukacPrzeznaiczenieApi.askAi('fate', this.history);
        this.history.push({role: 'assistant', content});

        try {
            return JSON.parse(content);
        } catch (err) {
            throw new Error("Błąd parsowania JSON: " + content);
        }
    }

    public resetContext() {
        this.history = [];
    }
}
