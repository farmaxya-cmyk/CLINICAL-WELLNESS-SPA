
import React from 'react';
import { marked } from 'marked';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { BeakerIcon } from '../components/icons/BeakerIcon';

interface PhaseResult {
    current: number;
    max: number;
    percentage: number;
    status: 'Insufficienza rilevata' | 'Insufficienza lieve' | 'Adeguato';
    color: string;
}

const ResultsScreen = ({ assessment, score, answers, onRetake, onBackToHome }) => {
    const result = assessment.results.find(r => score >= r.scoreMin && score <= r.scoreMax) 
        || assessment.results.sort((a,b) => a.scoreMin - b.scoreMin)[0];

    // --- SLEEP SPECIFIC LOGIC ---
    const isSleepAnalysis = assessment.id === 'sleep' && answers;
    const [phaseResults, setPhaseResults] = React.useState<Record<string, PhaseResult> | null>(null);
    const [galenicFormulation, setGalenicFormulation] = React.useState<{ingredients: string[], dosage: string, phases: string[]} | null>(null);

    React.useEffect(() => {
        if (isSleepAnalysis) {
            const phases = {
                "Fase 1": { current: 0, max: 0 },
                "Fase 2": { current: 0, max: 0 },
                "Fase 3-4": { current: 0, max: 0 },
                "REM": { current: 0, max: 0 }
            };

            assessment.questions.forEach((q, index) => {
                const answerValue = answers[index] || 0;
                // Gestione fasi multiple (es. "Fase 1 / REM")
                const targetPhases = q.phase ? q.phase.split(' / ').map(p => p.trim()) : [];
                
                targetPhases.forEach(p => {
                    if (phases[p]) {
                        phases[p].current += answerValue;
                        phases[p].max += 4; // Max score per domanda
                    }
                });
            });

            const computedResults: Record<string, PhaseResult> = {};
            Object.keys(phases).forEach(key => {
                const p = phases[key];
                const percentage = p.max > 0 ? Math.round((p.current / p.max) * 100) : 0;
                let status: PhaseResult['status'] = 'Adeguato';
                let color = 'text-green-600 bg-green-50';

                if (percentage < 60) {
                    status = 'Insufficienza rilevata';
                    color = 'text-red-600 bg-red-50';
                } else if (percentage < 75) {
                    status = 'Insufficienza lieve';
                    color = 'text-yellow-600 bg-yellow-50';
                }

                computedResults[key] = { current: p.current, max: p.max, percentage, status, color };
            });
            setPhaseResults(computedResults);

            // --- CALCOLO FORMULAZIONE GALENICA ---
            const phasesArray = Object.keys(computedResults).map(key => ({
                name: key,
                ...computedResults[key]
            }));
            
            phasesArray.sort((a, b) => a.percentage - b.percentage);

            const criticalPhases = phasesArray.filter(p => p.status !== 'Adeguato').slice(0, 2);

            if (criticalPhases.length > 0) {
                const uniqueRemedies = new Set<string>();
                criticalPhases.forEach(p => {
                    const phaseInfo = assessment.phaseRemedies?.[p.name];
                    if (phaseInfo && phaseInfo.remedies) {
                        phaseInfo.remedies.forEach((r: string) => uniqueRemedies.add(r));
                    }
                });

                if (uniqueRemedies.size > 0) {
                    setGalenicFormulation({
                        ingredients: Array.from(uniqueRemedies),
                        dosage: "1-2 capsule la sera prima di dormire",
                        phases: criticalPhases.map(p => p.name)
                    });
                } else {
                    setGalenicFormulation(null);
                }
            } else {
                setGalenicFormulation(null);
            }
        }
    }, [isSleepAnalysis, answers, assessment]);


    const handleDownloadTxt = () => {
        const date = new Date().toLocaleDateString('it-IT');
        let content = `=================================================\n`;
        content += `   CLINICAL WELLNESS SPA - REPORT DI ANALISI\n`;
        content += `=================================================\n\n`;
        
        content += `TEST ESEGUITO: ${assessment.title.toUpperCase()}\n`;
        content += `DATA: ${date}\n`;
        content += `PUNTEGGIO TOTALE: ${score}\n\n`;
        content += `RISULTATO SINTETICO: ${result.title}\n`;
        content += `-------------------------------------------------\n\n`;
        content += `ANALISI GENERALE:\n${result.summary}\n\n`;

        if (isSleepAnalysis && phaseResults) {
            content += `=================================================\n`;
            content += `   DETTAGLIO FASI DEL SONNO (ARCHITETTURA)\n`;
            content += `=================================================\n\n`;
            
            Object.keys(phaseResults).forEach(phase => {
                const res = phaseResults[phase];
                content += `${phase.toUpperCase()}: ${res.percentage}% - ${res.status}\n`;
                const info = assessment.phaseRemedies?.[phase];
                if (info) content += `> Nota: ${info.description}\n`;
                content += `\n`;
            });

            if (galenicFormulation) {
                content += `-------------------------------------------------\n`;
                content += `   CONSIGLIO TERAPEUTICO PERSONALIZZATO\n`;
                content += `-------------------------------------------------\n`;
                content += `Obiettivo Target: ${galenicFormulation.phases.join(', ')}\n\n`;
                content += `FORMULAZIONE GALENICA SUGGERITA:\n`;
                content += `[ ] ${galenicFormulation.ingredients.join(' + ')}\n\n`;
                content += `Posologia consigliata: ${galenicFormulation.dosage}\n`;
                content += `(Richiedi questa preparazione al banco farmacia)\n\n`;
            }

            content += `-------------------------------------------------\n`;
            content += `   CONSIGLI STRUMENTALI\n`;
            content += `-------------------------------------------------\n`;
            content += `POLISONNOGRAFIA: Consigliata in caso di sintomi persistenti,\napnee notturne sospette o se il punteggio totale è inferiore a 40.\n`;
        }

        content += `\n=================================================\n`;
        content += `Nota Legale: Questo documento è generato da un algoritmo di \nautovalutazione. Non costituisce diagnosi medica. \nConsultare sempre uno specialista.`;

        const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Report_${assessment.id}_${date.replace(/\//g, '-')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 md:p-8 text-center animate-fade-in pb-32">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">{result.title}</h2>
                <p className="text-lg text-slate-600 mb-6">Il tuo punteggio: <span className="font-bold text-sky-600">{score}</span></p>
                
                <div
                    className="prose text-slate-700 text-left my-6 mx-auto bg-slate-50 p-4 rounded-xl border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: marked.parse(result.summary) as string }}
                ></div>

                {/* SLEEP SPECIFIC REPORT UI */}
                {isSleepAnalysis && phaseResults && assessment.phaseRemedies && (
                    <div className="mt-8 text-left animate-slide-in-up">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Analisi Fasi del Sonno</h3>
                        <div className="space-y-6">
                            {Object.keys(phaseResults).map(phase => {
                                const res = phaseResults[phase];
                                const info = assessment.phaseRemedies[phase];

                                return (
                                    <div key={phase} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-slate-700">{phase}</h4>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${res.color}`}>
                                                {res.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-3 italic">{info.description}</p>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-1000 ${res.percentage < 60 ? 'bg-red-500' : res.percentage < 75 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                                style={{ width: `${res.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* GALENIC FORMULATION CARD */}
                        {galenicFormulation && (
                            <div className="mt-8 bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-md">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-100 rounded-full">
                                        <BeakerIcon className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-indigo-900">Formulazione Galenica Consigliata</h3>
                                </div>
                                <div className="mb-4">
                                    <p className="text-sm text-indigo-800 mb-2">Sulla base delle fasi più critiche ({galenicFormulation.phases.join(', ')}), consigliamo la seguente composizione:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {galenicFormulation.ingredients.map((ing, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-indigo-200 rounded-full text-sm font-semibold text-indigo-700 shadow-sm">
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/60 p-3 rounded-lg border border-indigo-100">
                                    <p className="text-sm font-bold text-indigo-900">Posologia:</p>
                                    <p className="text-sm text-indigo-800">{galenicFormulation.dosage}</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 bg-sky-50 p-6 rounded-xl border border-sky-100">
                            <h3 className="text-lg font-bold text-sky-800 mb-3">Consigli sull'Uso del Polisonnigrafo</h3>
                            <ul className="list-disc list-inside text-sm text-sky-900 space-y-2">
                                <li><strong>Sintomi Persistenti:</strong> Consigliato se soffri di apnee notturne o sonnolenza diurna eccessiva.</li>
                                <li><strong>Diagnosi Incerta:</strong> Utile quando il test autovalutativo suggerisce problemi complessi.</li>
                                <li><strong>Patologie:</strong> Fondamentale in presenza di disturbi cardiaci o respiratori concomitanti.</li>
                            </ul>
                            <p className="mt-4 text-xs text-sky-700 italic">
                                La polisonnografia offre una valutazione oggettiva e dettagliata che questo test non può sostituire.
                            </p>
                        </div>
                    </div>
                )}

                 <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                    <button
                        onClick={onRetake}
                        className="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Ripeti il test
                    </button>
                    <button
                        onClick={handleDownloadTxt}
                        className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/30"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        Scarica Report Completo (.txt)
                    </button>
                    <button
                        onClick={onBackToHome}
                        className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md"
                    >
                        Torna alla Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
