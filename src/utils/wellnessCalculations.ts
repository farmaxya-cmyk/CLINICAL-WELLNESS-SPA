
import { assessmentsData } from '../data/assessmentsData';

export interface WellnessScores {
    fitness: number | null; // 0-100 or null if not taken
    sleep: number | null;
    diet: number | null;
    stress: number | null;
    microbiome: number | null;
}

export interface CompositeScores {
    body: number | null;
    mind: number | null;
    emotions: number | null;
}

export interface TherapyRecommendation {
    title: string;
    status: 'critical' | 'moderate' | 'optimal';
    description: string;
    detailedContent?: string; // HTML/Markdown content
    therapies: string[];
    actionLink?: string; // New field for internal navigation
    iconKey?: 'sleep' | 'stress' | 'diet' | 'fitness' | 'structure' | 'emotion' | 'maintenance' | 'default' | 'beaker';
}

// Calcola il punteggio percentuale normalizzato per un test
export const calculatePercentage = (rawScore: number, assessmentId: string): number | null => {
    // Se rawScore è 0, assumiamo che il test non sia stato fatto (o che sia andato malissimo, 
    // ma nel contesto dell'app 0 solitamente è il valore iniziale di default)
    if (rawScore === 0) return null;

    const assessment = assessmentsData[assessmentId];
    if (!assessment) return null;
    
    // Max score approssimativo: numero domande * valore max (4)
    const maxPossible = assessment.questions.length * 4; 
    return Math.min(100, Math.round((rawScore / maxPossible) * 100));
};

// Calcola gli indici compositi basati sulle formule fornite
// Ritorna null se uno dei componenti manca
export const calculateComposites = (scores: WellnessScores): CompositeScores => {
    // Formule:
    // ENERGIA (ex Corpo) = 50% Fitness + 30% Sonno + 20% Dietetica
    // MENTE = 40% Sonno + 50% Stress + 10% Microbioma
    // EMOZIONI = 40% Sonno + 50% Stress + 10% Dietetica
    
    const calc = (v1: number | null, p1: number, v2: number | null, p2: number, v3: number | null, p3: number) => {
        if (v1 === null || v2 === null || v3 === null) return null;
        return Math.round((v1 * p1) + (v2 * p2) + (v3 * p3));
    };

    return {
        body: calc(scores.fitness, 0.5, scores.sleep, 0.3, scores.diet, 0.2),
        mind: calc(scores.sleep, 0.4, scores.stress, 0.5, scores.microbiome, 0.1),
        emotions: calc(scores.sleep, 0.4, scores.stress, 0.5, scores.diet, 0.1)
    };
};

// Contenuti Terapeutici Specifici
const THERAPY_CONTENT = {
    DEPRESSION_HAPPINESS: `
    <h4 class="font-bold text-sky-700 mb-2">ESERCIZI PER LA SALUTE E FELICITA' - Decalogo per la Gestione della Depressione</h4>
    <ol class="list-decimal list-inside space-y-1 text-sm">
        <li><strong>Mindfulness:</strong> Pratica la meditazione mindfulness per 20-30 minuti al giorno.</li>
        <li><strong>Esercizio Fisico:</strong> Fai esercizio fisico regolarmente, almeno 30 minuti al giorno.</li>
        <li><strong>Connettersi con gli Altri:</strong> Trascorri tempo con amici e familiari.</li>
        <li><strong>Pianificazione delle Attività:</strong> Organizza attività piacevoli e gratificanti.</li>
        <li><strong>Alimentazione Sana:</strong> Mantieni una dieta equilibrata e nutriente.</li>
        <li><strong>Routine del Sonno:</strong> Segui una routine regolare per il sonno.</li>
        <li><strong>Limitare l'Alcool:</strong> Evita il consumo eccessivo di alcool.</li>
        <li><strong>Diario delle Emozioni:</strong> Scrivi i tuoi pensieri e le tue emozioni ogni giorno.</li>
        <li><strong>Terapia e Supporto:</strong> Se necessario chiedi il supporto di un terapeuta.</li>
        <li><strong>Tecniche di Gestione dello Stress:</strong> Respirazione profonda e rilassamento muscolare.</li>
    </ol>
    <p class="mt-2 text-xs font-semibold">Durata degli Esercizi: 20 gg poi eseguire nuovamente i test.</p>
    `,
    MINDFULNESS_INSOMNIA: `
    <h4 class="font-bold text-sky-700 mb-2">MINDFULNESS PER GESTIRE L'INSONNIA</h4>
    <p class="text-sm mb-2">La pratica della Mindfulness può migliorare la qualità del sonno aiutando a calmare la mente prima di dormire. Attraverso la pratica regolare, si impara a osservare i propri pensieri senza esserne travolti.</p>
    <p class="text-sm mb-2">Si consiglia di meditare regolarmente <strong>15-20 minuti al giorno</strong> prima di andare a letto.</p>
    <p class="mt-2 text-xs font-semibold">Durata degli esercizi: 20 gg poi eseguire nuovamente i test.</p>
    `,
    OSTEOPATHY: `
    <h4 class="font-bold text-sky-700 mb-2">Postura, Stress e Longevità: Osteopatia Strutturale</h4>
    <p class="text-sm mb-2">L'Osteopatia interviene sulle disfunzioni strutturali, migliorando l'allineamento corporeo e prevenendo problemi legati a una postura scorretta. Il trattamento può agire sulla componente neurovegetativa e sullo stress.</p>
    <ul class="list-disc list-inside space-y-1 text-sm">
        <li>Miglioramento mobilità e respirazione</li>
        <li>Riduzione tensioni muscolari da stress</li>
        <li>Massaggi terapeutici per rilascio endorfine</li>
    </ul>
    <p class="mt-2 text-xs font-semibold">Durata del trattamento: 10 sedute poi eseguire nuovamente i test.</p>
    `,
    BINAURAL: `
    <h4 class="font-bold text-sky-700 mb-2">Terapia Binaurale per l'Ansia</h4>
    <p class="text-sm mb-2">Si consiglia terapia 20-30 minuti con <strong>Onde Alpha (α) + Onde Delta (δ)</strong>.</p>
    <ul class="list-disc list-inside space-y-1 text-sm">
        <li><strong>396 Hz:</strong> Libera dal senso di colpa e ansia</li>
        <li><strong>417 Hz:</strong> Cambiamento, lasciare andare il passato</li>
        <li><strong>528 Hz:</strong> Riparazione e armonizzazione del DNA</li>
    </ul>
    <p class="mt-2 text-xs font-semibold">Durata della terapia: 20 gg poi eseguire nuovamente i test.</p>
    `,
    SAUNA: `
    <h4 class="font-bold text-sky-700 mb-2">SAUNA INFRAROSSI</h4>
    <p class="text-sm mb-2">La sauna infrarossi produce un effettivo e localizzato dimagrimento (sino a 900 Kcal a seduta) ed elimina tossine e metalli pesanti.</p>
    <ul class="list-disc list-inside space-y-1 text-sm">
        <li>Migliora la pelle (più luminosa ed elastica)</li>
        <li>Favorisce il sonno e la circolazione</li>
        <li>Ottimo prima di massaggi e trattamenti estetici</li>
    </ul>
    <p class="mt-2 text-xs font-semibold">Durata: 10 sedute poi eseguire nuovamente i test.</p>
    `,
    DETOX: `
    <h4 class="font-bold text-sky-700 mb-2">TERAPIA DETOX - Tisane Naturali</h4>
    <ul class="list-disc list-inside space-y-1 text-sm">
        <li><strong>Tarassaco:</strong> azione depurativa (radice secca, scorza limone, zenzero).</li>
        <li><strong>Tè Verde e Ortica:</strong> azione antiossidante.</li>
        <li><strong>Finocchio e Zenzero:</strong> azione digestiva.</li>
        <li><strong>Zenzero e Curcuma:</strong> azione antinfiammatoria.</li>
    </ul>
    <p class="mt-2 text-xs font-semibold">Durata della terapia Detox: 4 settimane poi eseguire nuovamente i test.</p>
    `,
    BIOFEEDBACK: `
    <h4 class="font-bold text-sky-700 mb-2">COERENZA CARDIACA E HRV</h4>
    <p class="text-sm mb-2">Per combattere stress, ansia e insonnia, è fondamentale monitorare e migliorare la variabilità della frequenza cardiaca (HRV).</p>
    <ul class="list-disc list-inside space-y-1 text-sm">
        <li>Utilizza lo strumento di <strong>Coerenza Cardiaca</strong> in app quotidianamente.</li>
        <li>Valuta esami clinici specifici come <strong>Holter Cardiaco/Pressorio</strong> o <strong>ECG</strong> disponibili in farmacia.</li>
    </ul>
    `
};

// Genera raccomandazioni basate sulle intersezioni e sui punteggi singoli
export const getTherapyRecommendations = (composites: CompositeScores, scores: WellnessScores): TherapyRecommendation[] => {
    const recommendations: TherapyRecommendation[] = [];

    // Logica specifica basata sui punteggi singoli per attivare le card speciali
    
    // 1. STRESS / ANSIA -> Biofeedback, Binaurale, Mindfulness + INVITO A SERVIZI FARMACIA
    if (scores.stress !== null && scores.stress < 50) {
        recommendations.push({
            title: "Gestione Ansia & Stress",
            status: 'critical',
            description: "Livelli di stress elevati. Consigliamo di agire subito monitorando il cuore (HRV) e praticando il rilassamento.",
            detailedContent: THERAPY_CONTENT.BIOFEEDBACK + '<br/>' + THERAPY_CONTENT.BINAURAL,
            therapies: ["Coerenza Cardiaca (vedi app)", "Holter Cardiaco/Pressorio", "Test Cortisolo Salivare"],
            actionLink: 'breathing', // Link to breathing tool
            iconKey: 'stress'
        });
    }

    // 2. SONNO -> Mindfulness Insomnia + HRV
    if (scores.sleep !== null && scores.sleep < 50) {
        recommendations.push({
            title: "Qualità del Sonno",
            status: 'critical',
            description: "Il riposo notturno non è rigenerante. Oltre alla mindfulness, valuta l'impatto fisiologico dello stress.",
            detailedContent: THERAPY_CONTENT.MINDFULNESS_INSOMNIA + '<br/>' + `<p class='text-sm mt-2'>Consigliato anche check <strong>HRV e Coerenza Cardiaca</strong>.</p>`,
            therapies: ["Polisonnografia (prenota in analisi)", "Mindfulness serale", "Coerenza Cardiaca"],
            actionLink: 'analysisQuote',
            iconKey: 'sleep'
        });
    }

    // 3. DIETETICA / MICROBIOMA -> Detox
    if ((scores.diet !== null && scores.diet < 50) || (scores.microbiome !== null && scores.microbiome < 50)) {
        recommendations.push({
            title: "Detox & Nutrizione",
            status: 'moderate',
            description: "Il sistema digerente necessita di depurazione. Utile indagare intolleranze.",
            detailedContent: THERAPY_CONTENT.DETOX,
            therapies: ["Test Intolleranze/Microbioma", "Tisane depurative", "Piano nutrizionale"],
            actionLink: 'analysisQuote',
            iconKey: 'diet'
        });
    }

    // 4. FITNESS / DOLORI -> Osteopatia
    if (scores.fitness !== null && scores.fitness < 40) {
         recommendations.push({
            title: "Struttura & Postura",
            status: 'moderate',
            description: "Possibili tensioni muscolari. Un check-up posturale può prevenire dolori cronici.",
            detailedContent: THERAPY_CONTENT.OSTEOPATHY,
            therapies: ["Valutazione Osteopatica", "Massaggi decontratturanti", "Esercizi posturali"],
            actionLink: 'spaBookings',
            iconKey: 'structure'
        });
    }
    
     // 5. BENESSERE GENERALE BASSO -> Decalogo Felicità + Sauna
    if (composites.mind !== null && composites.mind < 50) {
        recommendations.push({
            title: "Riequilibrio Emozionale",
            status: 'critical',
            description: "Strategie per ritrovare la serenità. La sauna infrarossi può aiutare il rilascio di tensioni profonde.",
            detailedContent: THERAPY_CONTENT.DEPRESSION_HAPPINESS + '<br/>' + THERAPY_CONTENT.SAUNA,
            therapies: ["Supporto psicologico", "Sauna Infrarossi", "Percorsi SPA Relax"],
            actionLink: 'spaBookings',
            iconKey: 'emotion'
        });
    }


    // Logica Standard Basata sugli Indici Compositi (se non ci sono gravi criticità singole)
    const bodyMindAvg = composites.body !== null && composites.mind !== null ? (composites.body + composites.mind) / 2 : null;
    
    if (bodyMindAvg !== null && bodyMindAvg >= 60 && recommendations.length === 0) {
         recommendations.push({
            title: "Mantenimento Benessere",
            status: 'optimal',
            description: "Il tuo stato di salute è buono. Continua con protocolli di mantenimento per la longevità.",
            therapies: [
                "Massaggi di mantenimento",
                "Check-up annuale (Analisi sangue)",
                "Trattamenti viso/corpo prevenzione"
            ],
            actionLink: 'spaBookings',
            iconKey: 'maintenance'
        });
    }

    return recommendations;
};
