export const deepCopy = <T,>(of: T): T => JSON.parse(JSON.stringify(of));
