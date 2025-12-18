
import React from 'react';
import { marked } from 'marked';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { BeakerIcon } from '../components/icons/BeakerIcon';

const ResultsScreen = ({ assessment, score, answers, onRetake, onBackToHome }) => {
    const result = assessment.results.find(r => score >= r.scoreMin && score <= r.scoreMax) 
        || assessment.results.sort((a,b) => a.scoreMin - b.scoreMin)[0];

    const isSleep = assessment.id === 'sleep' && answers;
    const [phaseData, setPhaseData] = React.useState<any>(null);
    const [galenic, setGalenic] = React.useState<any>(null);

    React.useEffect(() => {
        if (isSleep) {
            const phases: any = { "Fase 1": 0, "Fase 2": 0, "Fase 3-4": 0, "REM": 0 };
            const counts: any = { "Fase 1": 0, "Fase 2": 0, "Fase 3-4": 0, "REM": 0 };

            assessment.questions.forEach((q, i) => {
                const val = answers[i] || 0;
                const pList = q.phase ? q.phase.split('/').map(s => s.trim()) : [];
                pList.forEach(p => { if(phases[p] !== undefined) { phases[p] += val; counts[p] += 4; } });
            });

            const results = Object.keys(phases).map(k => {
                const perc = counts[k] > 0 ? Math.round((phases[k]/counts[k])*100) : 100;
                return { name: k, percentage: perc, status: perc < 60 ? 'Insufficienza rilevata' : perc < 75 ? 'Lieve' : 'Adeguato' };
            });
            setPhaseData(results);

            const critical = [...results].sort((a,b) => a.percentage - b.percentage).filter(p => p.percentage < 75).slice(0,2);
            if (critical.length > 0) {
                const remedies = new Set();
                critical.forEach(c => assessment.phaseRemedies?.[c.name]?.remedies?.forEach(r => remedies.add(r)));
                setGalenic({ ingredients: Array.from(remedies), phases: critical.map(c => c.name) });
            }
        }
    }, [isSleep, answers, assessment]);

    const downloadTxt = () => {
        let txt = `REPORT CLINICAL WELLNESS SPA\nTest: ${assessment.title}\nData: ${new Date().toLocaleDateString()}\nPunteggio: ${score}/80\n\nRISULTATO: ${result.title}\n${result.summary.replace(/<[^>]*>?/gm, '')}\n\n`;
        
        if (phaseData) {
            txt += `ARCHITETTURA DEL SONNO:\n`;
            phaseData.forEach(p => txt += `- ${p.name}: ${p.percentage}% (${p.status})\n`);
            if (galenic) {
                txt += `\nFORMULA GALENICA CONSIGLIATA:\nTarget: ${galenic.phases.join(', ')}\nComposizione: ${galenic.ingredients.join(' + ')}\nPosologia: 1-2 cps la sera.\n`;
            }
        }
        
        const blob = new Blob([txt], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Wellness_Report_${assessment.id}.txt`;
        link.click();
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-3xl mx-auto border border-slate-100">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{result.title}</h2>
                <p className="text-sky-600 font-bold text-xl mb-6">Punteggio: {score}</p>
                
                <div className="prose prose-slate text-left bg-slate-50 p-6 rounded-2xl mb-8" dangerouslySetInnerHTML={{ __html: marked.parse(result.summary) as string }}></div>

                {phaseData && (
                    <div className="text-left mb-8 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Dettaglio Fasi del Sonno</h3>
                        {phaseData.map(p => (
                            <div key={p.name}>
                                <div className="flex justify-between text-sm font-bold mb-1"><span>{p.name}</span><span className={p.percentage < 60 ? 'text-red-500' : 'text-emerald-600'}>{p.percentage}%</span></div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${p.percentage < 60 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${p.percentage}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                )}

                {galenic && (
                    <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg mb-8 text-left">
                        <div className="flex items-center gap-3 mb-3"><BeakerIcon className="w-6 h-6"/> <h3 className="text-lg font-bold">Formula Galenica Personalizzata</h3></div>
                        <p className="text-indigo-100 text-sm mb-4">Ottimizzata per le fasi: {galenic.phases.join(', ')}</p>
                        <div className="bg-white/10 p-4 rounded-xl font-mono text-sm mb-2">{galenic.ingredients.join(' + ')}</div>
                        <p className="text-xs opacity-80">Richiedi la preparazione in Farmacia Centrale presentando questo report.</p>
                    </div>
                )}

                <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={onRetake} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Ripeti Test</button>
                    <button onClick={downloadTxt} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 hover:bg-emerald-600"><DownloadIcon className="w-5 h-5"/> Scarica Report (.txt)</button>
                    <button onClick={onBackToHome} className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700">Torna alla Home</button>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
