
import React from 'react';
import { getStoredJSON } from '../utils/storage';
import { 
    calculatePercentage, 
    calculateComposites, 
    getTherapyRecommendations,
    TherapyRecommendation
} from '../utils/wellnessCalculations';
import { WellnessRadarChart } from '../components/WellnessRadarChart';
import { LongevityBody } from '../components/LongevityBody';
import { BiorhythmChart, calculateBiorhythm } from '../components/BiorhythmChart';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { CalendarClockIcon } from '../components/icons/CalendarClockIcon';
import { wellnessProgramsData } from '../data/wellnessProgramsData';
import { assessmentsData } from '../data/assessmentsData';
import { LungIcon } from '../components/icons/LungIcon';
import { BrainSvg, EnergySkeletonSvg, EmotionsOrbSvg } from '../components/icons/WellnessIcons';
import { motivationalPath, allQuotes } from '../data/motivationalPath';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { FunctionalFoodMap } from '../components/FunctionalFoodMap';
import { SleepIcon } from '../components/icons/SleepIcon';
import { StressIcon } from '../components/icons/StressIcon';
import { DietIcon } from '../components/icons/DietIcon';
import { FitnessIcon } from '../components/icons/FitnessIcon';
import { BeakerIcon } from '../components/icons/BeakerIcon';

const MISSION_MAPPING = {
    sleep: {
        focus: "Migliorare il Riposo",
        missions: ['start_d_new_7', 'start_d_new_2', 'start_d_new_6', 'start_d_new_9']
    },
    fitness: {
        focus: "Attivazione Metabolica",
        missions: ['start_d_new_3', 'start_d_new_16', 'start_d_new_1']
    },
    diet: {
        focus: "Nutrizione Pulita",
        missions: ['start_d_new_13', 'start_d_new_22', 'start_d_new_5', 'start_d_new_21']
    },
    stress: {
        focus: "Gestione Stress",
        missions: ['start_d_new_0', 'start_d_new_17', 'start_d_new_18', 'start_d_new_15']
    },
    microbiome: {
        focus: "Equilibrio Intestinale",
        missions: ['start_d_new_22', 'start_d_new_4', 'start_d_new_13']
    }
};

const MEDITATION_MAPPING = {
    sleep: {
        rhythm: "4-7-8 Sonno",
        frequency: "Relax (Healing)",
        description: "Favorisci il sonno profondo rallentando il respiro e usando frequenze rigenerative."
    },
    fitness: {
        rhythm: "6-6 Allenamento",
        frequency: "Mind (Attivazione)",
        description: "Attiva la mente e il corpo con un ritmo energizzante."
    },
    diet: {
        rhythm: "Coerenza Cardiaca",
        frequency: "Relax (Healing)",
        description: "Riduci lo stress digestivo riportando equilibrio tra cuore e cervello."
    },
    stress: {
        rhythm: "Vagotonia",
        frequency: "Introspection (Profondità)",
        description: "Stimola il nervo vago per una calma profonda e gestione emotiva."
    },
    microbiome: {
        rhythm: "Vagotonia",
        frequency: "Introspection (Profondità)",
        description: "L'asse intestino-cervello beneficia di stati di profonda quiete interiore."
    }
};

const WellnessDashboard = ({ user, onNavigate }) => {
    const [scores, setScores] = React.useState({ fitness: null, sleep: null, diet: null, stress: null, microbiome: null });
    const [hasData, setHasData] = React.useState(false);
    const [birthDate, setBirthDate] = React.useState('');
    const [showBiorhythm, setShowBiorhythm] = React.useState(false);
    const [pathStartDate, setPathStartDate] = React.useState<string | null>(null);
    const [dailyQuote, setDailyQuote] = React.useState<{category: string, text: string} | null>(null);
    const [galenicData, setGalenicData] = React.useState<{ingredients: string[], dosage: string, phases: string[]} | null>(null);

    React.useEffect(() => {
        const getLatestScore = (assessmentId) => {
            const history = getStoredJSON(`assessmentHistory_${user.email}_${assessmentId}`, []);
            return history.length > 0 ? history[history.length - 1].score : 0;
        };

        const rawScores = {
            fitness: getLatestScore('fitness'),
            sleep: getLatestScore('sleep'),
            diet: getLatestScore('diet'),
            stress: getLatestScore('stress'),
            microbiome: getLatestScore('microbiome'),
        };

        const anyData = Object.values(rawScores).some(s => s > 0);
        setHasData(anyData);

        if (anyData) {
            setScores({
                fitness: calculatePercentage(rawScores.fitness, 'fitness'),
                sleep: calculatePercentage(rawScores.sleep, 'sleep'),
                diet: calculatePercentage(rawScores.diet, 'diet'),
                stress: calculatePercentage(rawScores.stress, 'stress'),
                microbiome: calculatePercentage(rawScores.microbiome, 'microbiome'),
            });
        }

        // --- GALENIC FORMULATION CALCULATION START ---
        // Recupera l'ultimo test del sonno
        const sleepHistory = getStoredJSON(`assessmentHistory_${user.email}_sleep`, []);
        
        if (sleepHistory.length > 0) {
            const latestSleep = sleepHistory[sleepHistory.length - 1];
            
            // 1. CASO OTTIMALE: Ci sono risposte salvate
            if (latestSleep && latestSleep.answers) {
                const phases = {
                    "Fase 1": { current: 0, max: 0 },
                    "Fase 2": { current: 0, max: 0 },
                    "Fase 3-4": { current: 0, max: 0 },
                    "REM": { current: 0, max: 0 }
                };

                const sleepAssessment = assessmentsData.sleep;
                
                // Itera su tutte le domande per calcolare i punteggi delle fasi
                sleepAssessment.questions.forEach((q, index) => {
                    const answerValue = latestSleep.answers[index] || 0;
                    const targetPhases = q.phase ? q.phase.split(' / ').map(p => p.trim()) : [];
                    
                    targetPhases.forEach(p => {
                        if (phases[p]) {
                            phases[p].current += answerValue;
                            phases[p].max += 4; // Max score per domanda (valore 4)
                        }
                    });
                });

                const computedResults = [];
                Object.keys(phases).forEach(key => {
                    const p = phases[key];
                    const percentage = p.max > 0 ? Math.round((p.current / p.max) * 100) : 100;
                    let status = 'Adeguato';
                    
                    if (percentage < 60) status = 'Insufficienza rilevata';
                    else if (percentage < 75) status = 'Insufficienza lieve';
                    
                    computedResults.push({ name: key, percentage, status });
                });

                // Ordina per percentuale crescente (i peggiori primi)
                computedResults.sort((a, b) => a.percentage - b.percentage);
                
                const criticalPhases = computedResults.filter(p => p.status !== 'Adeguato');

                if (criticalPhases.length > 0) {
                    const targetPhases = criticalPhases.slice(0, 2);
                    const uniqueRemedies = new Set<string>();
                    
                    targetPhases.forEach(p => {
                        const phaseInfo = sleepAssessment.phaseRemedies?.[p.name];
                        if (phaseInfo && phaseInfo.remedies) {
                            phaseInfo.remedies.forEach((r: string) => uniqueRemedies.add(r));
                        }
                    });

                    if (uniqueRemedies.size > 0) {
                        setGalenicData({
                            ingredients: Array.from(uniqueRemedies),
                            dosage: "1-2 capsule la sera prima di dormire",
                            phases: targetPhases.map(p => p.name)
                        });
                    }
                } else {
                    setGalenicData(null);
                }
            } 
            // 2. CASO FALLBACK: C'è un punteggio basso (<60%) ma NON ci sono risposte dettagliate (es. test vecchio)
            else if (latestSleep.score < 48) { // Circa 60% di 80
                 setGalenicData({
                    ingredients: ["Melatonina Complex", "Valeriana", "Passiflora"],
                    dosage: "1 capsula 30min prima di dormire",
                    phases: ["Generale (Rifai il test per dettagli)"]
                });
            } else {
                setGalenicData(null);
            }
        }
        // --- GALENIC FORMULATION CALCULATION END ---

        const savedBirthDate = localStorage.getItem(`birthDate_${user.email}`);
        if (savedBirthDate) {
            setBirthDate(savedBirthDate);
            setShowBiorhythm(true);
        }

        const savedPathStart = localStorage.getItem(`motivationalPathStartDate_${user.email}`);
        setPathStartDate(savedPathStart);

        const today = new Date();
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        const quoteIndex = dayOfYear % allQuotes.length;
        setDailyQuote(allQuotes[quoteIndex]);

    }, [user.email]);

    const handleBirthDateSubmit = (e) => {
        e.preventDefault();
        if (birthDate) {
            localStorage.setItem(`birthDate_${user.email}`, birthDate);
            setShowBiorhythm(true);
        }
    };

    const handleStartPath = () => {
        const now = new Date().toISOString();
        localStorage.setItem(`motivationalPathStartDate_${user.email}`, now);
        setPathStartDate(now);
    };

    const handleRestartPath = () => {
        if (confirm("Vuoi ricominciare il percorso guidato dal primo passo?")) {
            const now = new Date().toISOString();
            localStorage.setItem(`motivationalPathStartDate_${user.email}`, now);
            setPathStartDate(now);
        }
    };

    const handleEndPath = () => {
        localStorage.removeItem(`motivationalPathStartDate_${user.email}`);
        setPathStartDate(null);
    };

    const pathCurrentDay = React.useMemo(() => {
        if (!pathStartDate) return 0;
        const start = new Date(pathStartDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }, [pathStartDate]);

    const pathData = React.useMemo(() => {
        if (pathCurrentDay > 0 && pathCurrentDay <= motivationalPath.length) {
            return motivationalPath[pathCurrentDay - 1];
        }
        return null;
    }, [pathCurrentDay]);

    const getRecommendationIcon = (key) => {
        switch (key) {
            case 'sleep': return <SleepIcon className="w-6 h-6 text-indigo-600" />;
            case 'stress': return <StressIcon className="w-6 h-6 text-orange-600" />;
            case 'diet': return <DietIcon className="w-6 h-6 text-emerald-600" />;
            case 'fitness': return <FitnessIcon className="w-6 h-6 text-red-600" />;
            case 'structure': return <FitnessIcon className="w-6 h-6 text-blue-600" />;
            case 'emotion': return <SparklesIcon className="w-6 h-6 text-purple-600" />;
            case 'maintenance': return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
            case 'beaker': return <BeakerIcon className="w-6 h-6 text-indigo-600" />;
            default: return <SparklesIcon className="w-6 h-6 text-sky-600" />;
        }
    };

    const composites = calculateComposites(scores);
    // Base recommendations
    let recommendations = getTherapyRecommendations(composites, scores);

    // --- LOGICA FILTRO E INSERIMENTO GALENICA ---
    if (galenicData) {
        // 1. RIMUOVI LE CARD GENERICHE SE ESISTONO
        recommendations = recommendations.filter(rec => 
            rec.title !== "Qualità del Sonno" && 
            rec.title !== "Gestione Ansia & Stress"
        );

        // 2. CREA LA CARD SPECIFICA
        const galenicCard: TherapyRecommendation = {
            title: "Formulazione Galenica Personalizzata",
            status: 'critical',
            description: `Dall'analisi del tuo sonno, abbiamo individuato carenze specifiche nelle fasi: ${galenicData.phases.join(', ')}. Questa formulazione è studiata per agire in modo mirato.`,
            detailedContent: `
                <h4 class="font-bold text-indigo-700 mb-2">Composizione su Misura</h4>
                <p class="text-sm mb-3">Ingredienti selezionati per le tue fasi critiche:</p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${galenicData.ingredients.map(ing => `<span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs font-bold">${ing}</span>`).join('')}
                </div>
                <p class="text-sm font-bold text-slate-700">Posologia consigliata:</p>
                <p class="text-sm text-slate-600 mb-3">${galenicData.dosage}</p>
                <p class="text-xs italic text-slate-500">Puoi richiedere la preparazione di questa formula direttamente al nostro laboratorio.</p>
                ${galenicData.phases[0].includes('Generale') ? '<p class="text-xs font-bold text-red-500 mt-2">NOTA: Per una formula più precisa, rifai il Test del Sonno.</p>' : ''}
            `,
            therapies: ["Richiedi preparazione in Farmacia", "Monitora il sonno dopo 30gg"],
            actionLink: 'prescriptions', // Porta all'invio ricette/richieste
            iconKey: 'beaker'
        };

        // 3. INSERISCI LA CARD GALENICA IN CIMA
        recommendations.unshift(galenicCard);
    }

    const today = new Date();
    const bioScores = showBiorhythm && birthDate ? {
        physical: Math.round(calculateBiorhythm(new Date(birthDate), today, 23)),
        emotional: Math.round(calculateBiorhythm(new Date(birthDate), today, 28)),
        intellectual: Math.round(calculateBiorhythm(new Date(birthDate), today, 33)),
    } : null;

    const handleDownloadReport = () => {
        const date = new Date().toLocaleDateString('it-IT');
        let content = `CLINICAL WELLNESS SPA - REPORT OLISTICO\nData: ${date}\nUtente: ${user.name}\n\n`;
        
        content += `--- PUNTEGGI BASE ---\n`;
        content += `Fitness: ${scores.fitness ?? '-'}%\n`;
        content += `Sonno: ${scores.sleep ?? '-'}%\n`;
        content += `Dietetica: ${scores.diet ?? '-'}%\n`;
        content += `Stress: ${scores.stress ?? '-'}%\n`;
        content += `Microbioma: ${scores.microbiome ?? '-'}%\n\n`;
        
        content += `--- INDICI SINERGICI ---\n`;
        content += `Mente: ${composites.mind ?? '-'}%\n`;
        content += `Energia: ${composites.body ?? '-'}%\n`;
        content += `Emozioni: ${composites.emotions ?? '-'}%\n\n`;

        if (bioScores) {
            content += `--- BIORITMI (Oggi) ---\n`;
            content += `Fisico: ${bioScores.physical > 0 ? '+' : ''}${bioScores.physical}%\n`;
            content += `Emozionale: ${bioScores.emotional > 0 ? '+' : ''}${bioScores.emotional}%\n`;
            content += `Intellettuale: ${bioScores.intellectual > 0 ? '+' : ''}${bioScores.intellectual}%\n\n`;
        }
        
        if (activeSuggestion) {
            content += `--- FOCUS CONSIGLIATO ---\n`;
            content += `Area: ${activeSuggestion.area.toUpperCase()}\n`;
            content += `Obiettivo: ${activeSuggestion.focus}\n\n`;
        }

        if (galenicData) {
            content += `--- FORMULAZIONE GALENICA ---\n`;
            content += `Target: ${galenicData.phases.join(', ')}\n`;
            content += `Ingredienti: ${galenicData.ingredients.join(', ')}\n`;
            content += `Posologia: ${galenicData.dosage}\n\n`;
        }

        if (recommendations.length > 0) {
            content += `--- PIANO TERAPEUTICO ---\n`;
            recommendations.forEach(rec => {
                content += `\n[${rec.title}] - ${rec.status.toUpperCase()}\n`;
                content += `${rec.description}\n`;
                content += `Terapie consigliate:\n`;
                rec.therapies.forEach(t => content += ` - ${t}\n`);
            });
        }
        
        const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Wellness_Report_${date.replace(/\//g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getSmartSuggestions = () => {
        const validScores = Object.entries(scores).filter(([_, val]) => val !== null) as [string, number][];
        if (validScores.length === 0) return null;

        const sortedScores = validScores.sort((a, b) => a[1] - b[1]);
        const worstArea = sortedScores[0];
        
        if (worstArea[1] > 70) return null;

        const missionMap = MISSION_MAPPING[worstArea[0]];
        const meditationMap = MEDITATION_MAPPING[worstArea[0]];

        if (!missionMap) return null;

        const suggestedMissionsDetails = missionMap.missions.map(id => {
            return wellnessProgramsData.start.daily?.find(m => m.id === id);
        }).filter(Boolean);

        return {
            area: worstArea[0],
            score: worstArea[1],
            focus: missionMap.focus,
            missions: suggestedMissionsDetails.slice(0, 2),
            meditation: meditationMap
        };
    };

    const activeSuggestion = getSmartSuggestions();

    const getRadarInterpretation = () => {
        const entries = [
            { name: 'Fitness', val: scores.fitness },
            { name: 'Sonno', val: scores.sleep },
            { name: 'Dietetica', val: scores.diet },
            { name: 'Stress', val: scores.stress },
            { name: 'Microbioma', val: scores.microbiome }
        ].filter(e => e.val !== null);
        
        if (entries.length === 0) return <p className="text-slate-500 italic">Completa i test per vedere l'analisi.</p>;

        const sorted = [...entries].sort((a, b) => b.val - a.val);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const avg = Math.round(entries.reduce((acc, curr) => acc + curr.val, 0) / entries.length);

        return (
            <p className="text-slate-600 text-sm leading-relaxed">
                Il tuo <strong>Wellness Index</strong> attuale è <strong>{avg}%</strong>. 
                Il tuo punto di forza è l'area <strong>{best.name}</strong> ({best.val}%), continua così! 
                {best.name !== worst.name && (
                    <>
                    L'area che richiede più attenzione è <strong>{worst.name}</strong> ({worst.val}%), che potrebbe influenzare negativamente il tuo equilibrio. 
                    Consulta il Piano Terapeutico qui sotto per strategie mirate.
                    </>
                )}
            </p>
        );
    };

    const getBiorhythmAdvice = (type, bioVal, wellnessVal) => {
        const bioState = bioVal > 20 ? 'high' : bioVal < -20 ? 'low' : 'critical';
        const wellState = wellnessVal === null ? 'unknown' : wellnessVal > 60 ? 'strong' : 'weak';

        let title = "";
        let body = "";

        if (type === 'physical') {
            if (bioState === 'high' && wellState === 'strong') { title = "Performance Ottimale"; body = "Oggi è il giorno giusto per allenamenti intensi o sfide fisiche."; }
            else if (bioState === 'high' && wellState === 'weak') { title = "Spinta Energetica"; body = "Il bioritmo ti sostiene nonostante la stanchezza di fondo. Buon momento per riprendere l'attività."; }
            else if (bioState === 'low' && wellState === 'strong') { title = "Mantenimento"; body = "Hai buone riserve, ma il ciclo è basso. Non esagerare con gli sforzi."; }
            else if (bioState === 'low' && wellState === 'weak') { title = "Riposo Necessario"; body = "Doppia criticità. Dedicati al recupero, stretching o sonno extra."; }
            else { title = "Fase di Transizione"; body = "Attenzione agli infortuni, evita sforzi improvvisi."; }
        }
        else if (type === 'emotional') {
            if (bioState === 'high' && wellState === 'strong') { title = "Carisma e Socialità"; body = "Ottimo momento per relazioni e creatività."; }
            else if (bioState === 'high' && wellState === 'weak') { title = "Resilienza"; body = "Il bioritmo ti aiuta a gestire lo stress accumulato. Giornata buona per risolvere conflitti."; }
            else if (bioState === 'low') { title = "Introspezione"; body = "Potresti sentirti più sensibile. Evita discussioni importanti oggi."; }
            else { title = "Equilibrio Instabile"; body = "Umore variabile, pratica la coerenza cardiaca."; }
        }
        else if (type === 'intellectual') {
            if (bioState === 'high') { title = "Focus Mentale"; body = "Capacità di apprendimento e concentrazione al massimo."; }
            else if (bioState === 'low') { title = "Routine"; body = "Evita decisioni complesse o studio intenso. Meglio attività ripetitive."; }
            else { title = "Criticità"; body = "Possibili distrazioni. Rivedi due volte il tuo lavoro."; }
        }

        return { title, body };
    };

    const SummaryCard = ({ type, label, compositeValue, bioValue, borderClass, bgClass, iconColorClass }) => {
        const advice = bioScores ? getBiorhythmAdvice(type, bioValue, compositeValue) : null;
        
        return (
            <div className={`p-4 rounded-xl border-2 ${borderClass} ${bgClass} shadow-md h-full flex flex-col justify-between`}>
                <div>
                    <h3 className={`font-bold text-sm uppercase tracking-wider mb-4 ${iconColorClass}`}>{label}</h3>
                    
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Livello Base</span>
                            <span className="text-xl font-black text-slate-700">
                                {compositeValue !== null ? `${compositeValue}%` : '-'}
                            </span>
                        </div>

                        {bioScores && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bioritmo Oggi</span>
                                <span className={`text-xl font-black ${bioValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {bioValue > 0 ? '+' : ''}{bioValue}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-auto pt-3 border-t border-slate-200/60">
                    {advice ? (
                        <>
                            <p className={`font-bold text-xs mb-1 ${iconColorClass}`}>{advice.title}</p>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">{advice.body}</p>
                        </>
                    ) : (
                        <p className="text-xs text-slate-400 italic">Inserisci la data di nascita per i consigli giornalieri.</p>
                    )}
                </div>
            </div>
        );
    };

    if (!hasData) {
        return (
            <div className="p-8 animate-fade-in text-center">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-10">
                    <h1 className="text-3xl font-bold text-slate-800 mb-4">Wellness Dashboard</h1>
                    <p className="text-slate-600 mb-8">Non hai ancora dati sufficienti per generare la tua mappa della longevità. Completa i test di autovalutazione per sbloccare questa funzione.</p>
                    <button 
                        onClick={() => onNavigate('assessments')}
                        className="bg-sky-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-700 transition-colors shadow-lg"
                    >
                        Vai ai Test
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32 max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">Wellness Dashboard</h1>
                    <p className="text-xl text-slate-600">Analisi olistica del tuo stato di salute e longevità.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm text-slate-500">Ultimo aggiornamento</p>
                    <p className="font-mono font-semibold text-slate-700">{new Date().toLocaleDateString()}</p>
                    <button onClick={handleDownloadReport} className="mt-2 text-xs flex items-center justify-end gap-1 text-sky-600 hover:text-sky-800 font-bold w-full">
                        <DownloadIcon className="w-4 h-4" /> Scarica Report (.txt)
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-6 bg-sky-500 rounded-full"></span>
                            Radar Benessere
                        </h2>
                        <div className="flex justify-center relative">
                            <WellnessRadarChart scores={scores} composites={composites} />
                        </div>
                        
                        <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                                <SparklesIcon className="w-4 h-4 text-sky-600" />
                                <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Analisi Sintetica</h3>
                            </div>
                            {getRadarInterpretation()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard 
                            type="physical" 
                            label="Energia & Fisico" 
                            compositeValue={composites.body} 
                            bioValue={bioScores?.physical}
                            bgClass="bg-emerald-50"
                            borderClass="border-emerald-500"
                            iconColorClass="text-emerald-800"
                        />
                        <SummaryCard 
                            type="intellectual" 
                            label="Mente & Intelletto" 
                            compositeValue={composites.mind} 
                            bioValue={bioScores?.intellectual}
                            bgClass="bg-sky-50"
                            borderClass="border-sky-500"
                            iconColorClass="text-sky-800"
                        />
                        <SummaryCard 
                            type="emotional" 
                            label="Cuore & Emozioni" 
                            compositeValue={composites.emotions} 
                            bioValue={bioScores?.emotional}
                            bgClass="bg-orange-50"
                            borderClass="border-orange-500"
                            iconColorClass="text-orange-800"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-full flex flex-col">
                     <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                        Mappa del Benessere
                    </h2>
                    <div className="flex-grow">
                        <LongevityBody 
                            scores={scores} 
                            composites={composites} 
                            gender={user.gender || 'female'} 
                        />
                    </div>
                </div>
            </div>

            {activeSuggestion && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-lg border border-indigo-100 mb-12 animate-fade-in">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="flex-shrink-0 p-4 bg-white rounded-full shadow-sm">
                            <SparklesIcon className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="flex-grow w-full">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">
                                Focus Consigliato: <span className="text-purple-700 uppercase">{activeSuggestion.focus}</span>
                            </h2>
                            <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                                Il tuo punteggio in <strong>{activeSuggestion.area.toUpperCase()}</strong> è basso ({activeSuggestion.score}%). 
                                Questo influenza negativamente la tua energia "Base".
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {activeSuggestion.missions.map((mission) => (
                                    <div key={mission.id} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{mission.Icon}</span>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">{mission.title}</p>
                                                <p className="text-xs text-slate-500">{mission.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {activeSuggestion.meditation && (
                                <div className="mt-4 bg-white/60 p-4 rounded-xl border border-indigo-200">
                                    <h3 className="font-bold text-indigo-800 text-sm flex items-center gap-2 mb-2">
                                        <LungIcon className="w-4 h-4" /> Protocollo Meditativo Consigliato
                                    </h3>
                                    <p className="text-sm text-slate-700 mb-2">
                                        {activeSuggestion.meditation.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                            Ritmo: {activeSuggestion.meditation.rhythm}
                                        </span>
                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                                            Frequenza: {activeSuggestion.meditation.frequency}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => onNavigate('breathing')}
                                        className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                                    >
                                        Vai alla Meditazione Guidata →
                                    </button>
                                </div>
                            )}
                            
                            <div className="mt-4 text-right">
                                <button 
                                    onClick={() => onNavigate('wellnessRoutine')}
                                    className="text-sm font-bold text-purple-600 hover:text-purple-800 underline"
                                >
                                    Vai alla Routine Completa →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-12 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <CalendarClockIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">BioPulse: Onda Temporale</h2>
                        <p className="text-slate-500 text-sm">Visualizza l'andamento dei tuoi cicli nei prossimi giorni.</p>
                    </div>
                </div>

                {!showBiorhythm ? (
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                        <p className="text-slate-600 mb-4">Per calcolare i tuoi bioritmi, abbiamo bisogno della tua data di nascita.</p>
                        <form onSubmit={handleBirthDateSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <input 
                                type="date" 
                                required
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                            <button type="submit" className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">
                                Calcola Bioritmi
                            </button>
                        </form>
                    </div>
                ) : (
                    <div>
                        <BiorhythmChart birthDate={new Date(birthDate)} targetDate={new Date()} />
                        <div className="mt-6 flex flex-wrap justify-center gap-4 md:gap-8">
                            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                                <EnergySkeletonSvg className="w-5 h-5 text-green-600" />
                                <span className="text-xs font-bold text-green-800">Fisico (23gg)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                                <EmotionsOrbSvg className="w-5 h-5 text-orange-500" />
                                <span className="text-xs font-bold text-orange-800">Emotivo (28gg)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200">
                                <BrainSvg className="w-5 h-5 text-sky-600" />
                                <span className="text-xs font-bold text-sky-800">Intellettuale (33gg)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mb-12">
                <FunctionalFoodMap customSleepFormulation={galenicData} />
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl p-8 mb-12 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <SparklesIcon className="w-32 h-32 text-white" />
                </div>
                
                {!pathStartDate ? (
                    <div className="relative z-10 text-center">
                        <h2 className="text-xl font-bold text-sky-200 mb-2 uppercase tracking-wide">💡 Ispirazione Quotidiana</h2>
                        {dailyQuote ? (
                            <div className="py-6">
                                <p className="text-2xl md:text-3xl font-bold text-white mb-6 leading-relaxed font-serif italic">
                                    "{dailyQuote.text}"
                                </p>
                                <span className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm text-sky-100 font-semibold">
                                    {dailyQuote.category}
                                </span>
                            </div>
                        ) : <p>Caricamento...</p>}
                        
                        <div className="mt-8 border-t border-white/10 pt-6">
                            <p className="text-lg text-slate-300 mb-4">
                                Vuoi un cambiamento radicale? Inizia il percorso guidato.
                            </p>
                            <button 
                                onClick={handleStartPath}
                                className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
                            >
                                Inizia il Percorso di Trasformazione
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            📅 Percorso Guidato al Cambiamento
                        </h2>
                        {pathCurrentDay > 14 ? (
                            <div className="text-center py-6">
                                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-4">
                                    🎉 Missione Compiuta!
                                </h3>
                                <p className="text-slate-300 mb-2">Hai completato i 14 giorni di attivazione. Queste nuove abitudini sono ora parte di te.</p>
                                <p className="text-slate-400 mb-8 text-sm">Ora puoi scegliere se mantenere queste abitudini con l'ispirazione quotidiana o ricominciare il ciclo per rafforzarle.</p>
                                
                                {dailyQuote && (
                                    <div className="bg-white/10 p-4 rounded-xl mb-8 max-w-lg mx-auto">
                                        <p className="text-sm text-sky-200 mb-2">La tua ispirazione finale:</p>
                                        <p className="italic">"{dailyQuote.text}"</p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <button 
                                        onClick={handleEndPath} 
                                        className="bg-white text-slate-900 font-bold py-3 px-6 rounded-full shadow-lg hover:bg-slate-100 transition-colors"
                                    >
                                        Vai al Mantenimento (Ispirazione Quotidiana)
                                    </button>
                                    <button 
                                        onClick={handleRestartPath} 
                                        className="text-slate-400 hover:text-white underline text-sm"
                                    >
                                        Ricomincia il ciclo dal Giorno 1
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {pathData && (
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
                                        <div className="flex flex-col md:flex-row gap-6 items-center">
                                            <div className="flex-grow text-center md:text-left">
                                                <h3 className="text-lg font-medium text-sky-200 mb-2 uppercase tracking-wider">Messaggio del Giorno</h3>
                                                <p className="text-xl md:text-2xl font-bold text-white mb-4 leading-relaxed">
                                                    "{pathData.message}"
                                                </p>
                                                <div className="inline-block bg-slate-800 px-4 py-2 rounded-lg border border-slate-600">
                                                    <p className="text-sm text-slate-400 italic mb-1">{pathData.category}</p>
                                                    <p className="text-md text-sky-100 font-serif">{pathData.quote}</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 text-center">
                                                <div className="w-20 h-20 rounded-full bg-sky-500/20 border-2 border-sky-500 flex items-center justify-center text-2xl font-bold text-white mb-2 mx-auto">
                                                    {pathCurrentDay}
                                                </div>
                                                <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">Passo</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 text-right">
                                     <button onClick={handleRestartPath} className="text-xs text-slate-500 hover:text-slate-300">Reset Percorso</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl shadow-xl p-8 mb-12 text-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-300">
                <div>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                        <ClipboardListIcon className="w-8 h-8 text-sky-600" />
                        Analisi Cliniche Consigliate
                    </h2>
                    <p className="text-slate-600 max-w-2xl">
                        Hai completato i test di autovalutazione. Per ottenere un quadro clinico completo e personalizzato, prenota le analisi specifiche consigliate per i tuoi obiettivi di salute in CLINICAL WELLNESS SPA presso Farmacia Centrale Montesilvano.
                    </p>
                </div>
                <button 
                    onClick={() => onNavigate('analysisQuote')}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg whitespace-nowrap flex items-center gap-2"
                >
                    <span>Scegli i tuoi obiettivi</span>
                    <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                </button>
            </div>

            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-slate-800 border-b border-slate-200 pb-4">Piano Terapeutico Integrato</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {recommendations.map((rec, index) => (
                        <div key={index} className={`bg-white rounded-2xl shadow-lg overflow-hidden border-t-4 ${
                            rec.status === 'critical' ? 'border-red-500' : 
                            rec.status === 'moderate' ? 'border-yellow-500' : 'border-green-500'
                        }`}>
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${rec.status === 'critical' ? 'bg-red-50' : rec.status === 'moderate' ? 'bg-yellow-50' : 'bg-green-50'}`}>
                                            {getRecommendationIcon(rec.iconKey)}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">{rec.title}</h3>
                                    </div>
                                    {rec.status === 'critical' && <div className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-sm"><XCircleIcon className="w-4 h-4" /> <span>Critico</span></div>}
                                    {rec.status === 'moderate' && <div className="flex items-center gap-1 text-yellow-600 font-bold bg-yellow-50 px-2 py-1 rounded text-sm"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> <span>Moderato</span></div>}
                                    {rec.status === 'optimal' && <div className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm"><CheckCircleIcon className="w-4 h-4" /> <span>Ottimale</span></div>}
                                </div>
                                
                                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                                    {rec.description}
                                </p>

                                <div className="flex-grow">
                                    {rec.detailedContent ? (
                                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 prose prose-sm max-w-none mb-4" dangerouslySetInnerHTML={{__html: rec.detailedContent}}></div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                                            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">Protocollo Consigliato</h4>
                                            <ul className="space-y-2">
                                                {rec.therapies.map((therapy, tIndex) => (
                                                    <li key={tIndex} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                                        {therapy}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                {rec.actionLink && (
                                    <button 
                                        onClick={() => onNavigate(rec.actionLink)}
                                        className="w-full mt-auto py-2 px-4 bg-sky-100 text-sky-700 font-semibold rounded-lg hover:bg-sky-200 transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        Vai alla risorsa consigliata <ArrowLeftIcon className="w-4 h-4 rotate-180"/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 text-center text-slate-400 text-sm">
                <p>Analisi basata su algoritmi di intelligenza artificiale clinica. I risultati non sostituiscono il parere medico.</p>
            </div>
        </div>
    );
};

export default WellnessDashboard;
