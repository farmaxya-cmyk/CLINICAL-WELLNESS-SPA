export function getStoredJSON(key: string, defaultValue: any): any {
    try {
        const item = localStorage.getItem(key);
        // Se l'item è la stringa "undefined", trattalo come nullo per evitare errori di parsing.
        if (item === "undefined") {
            return defaultValue;
        }
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, error);
        // Rimuovi l'elemento corrotto per prevenire errori futuri.
        localStorage.removeItem(key);
        return defaultValue;
    }
}
