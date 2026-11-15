export const useConfig = () => {
  // seed = "konto" w bazie, które pamięta już pokazane zagadki (tabela seen_items)
  const SEED_NAME = 'valhalla';
  // motywy zagadek do wylosowania; [] = wszystkie poza polskimi ("pl")
  // "valhalla-2026" to 6 zespołów przygotowanych na quiz w 2026 (dawniej lista w useRiddles.ts)
  const THEMES: string[] = ['valhalla-2026'];
  const RIDDLES_LENGTH = 6;
  const SOLVING_TIME = 60 * 1000;
  return {
    SEED_NAME,
    THEMES,
    RIDDLES_LENGTH,
    SOLVING_TIME
  }
}
