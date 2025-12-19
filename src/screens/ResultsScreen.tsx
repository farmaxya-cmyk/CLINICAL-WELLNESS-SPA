
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
                const pList = q.phase ? q.phase.split(' / ').map(s => s.trim()) : [];
                pList.forEach(p => { 
                    if(phases[p] !== undefined) { 
                        phases[p] += val; 
                        counts[p] += 4; 
                    } 
                });
            });

            const results = Object.keys(phases).map(k => {
                const perc = counts[k] > 0 ? Math.round((phases[k]/counts[k])*100) : 100;
                return { name: k, percentage: perc, status: perc < 60 ? 'Critico' : perc < 75 ? 'Lieve' : 'Ottimale' };
            });
            setPhaseData(results);

            const critical = [...results].sort((a,b) => a.percentage - b.percentage).filter(p => p.percentage < 75).slice(0,2);
            if (critical.length > 0) {
                const remedies = new Set();
                critical.forEach(c => assessment.phaseRemedies?.[c.name]?.remedies?.forEach((r: any) => remedies.add(r)));
                setGalenic({ ingredients: Array.from(remedies), phases: critical.map(c => c.name) });
            }
        }
    }, [isSleep, answers, assessment]);

    const downloadTxt = () => {
        const cleanSummary = result.summary.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        let txt = `=================================================\n`;
        txt += `   CLINICAL WELLNESS SPA - REPORT DI VALUTAZIONE\n`;
        txt += `=================================================\n\n`;
        txt += `TEST: ${assessment.title.toUpperCase()}\n`;
        txt += `DATA: ${new Date().toLocaleDateString('it-IT')}\n`;
        txt += `PUNTEGGIO: ${score} / 80\n\n`;
        txt += `RISULTATO: ${result.title}\n`;
        txt += `-------------------------------------------------\n`;
        txt += `${cleanSummary}\n\n`;
        
        if (phaseData) {
            txt += `DETTAGLIO ARCHITETTURA DEL SONNO:\n`;
            phaseData.forEach(p => {
                txt += `- ${p.name.padEnd(10)}: ${p.percentage}% (${p.status})\n`;
            });
            
            if (galenic) {
                txt += `\n-------------------------------------------------\n`;
                txt += `   PIANO GALENICO PERSONALIZZATO\n`;
                txt += `-------------------------------------------------\n`;
                txt += `OBIETTIVO: Supporto ${galenic.phases.join(' e ')}\n`;
                txt += `COMPOSIZIONE: ${galenic.ingredients.join(' + ')}\n`;
                txt += `POSOLOGIA: 1-2 capsule 30 min prima di coricarsi.\n\n`;
                txt += `Porta questo report in Farmacia Centrale Montesilvano.\n`;
            }
        }
        txt += `\n=================================================\n`;
        txt += `Disclaimer: Autovalutazione AI. Non sostituisce il medico.`;
        
        const blob = new Blob(["\uFEFF" + txt], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Report_${assessment.id}_${Date.now()}.txt`;
        link.click();
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-3xl mx-auto border border-slate-100">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{result.title}</h2>
                <p className="text-sky-600 font-bold text-xl mb-6">Punteggio: {score}</p>
                
                <div className="prose prose-slate text-left bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100" dangerouslySetInnerHTML={{ __html: marked.parse(result.summary) as string }}></div>

                {phaseData && (
                    <div className="text-left mb-8 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Analisi del Sonno</h3>
                        {phaseData.map(p => (
                            <div key={p.name}>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-slate-700">{p.name}</span>
                                    <span className={p.percentage < 60 ? 'text-red-500' : 'text-emerald-600'}>{p.percentage}% - {p.status}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${p.percentage < 60 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${p.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {galenic && (
                    <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg mb-8 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BeakerIcon className="w-24 h-24 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <BeakerIcon className="w-6 h-6"/> 
                                <h3 className="text-lg font-bold">Formula Personalizzata</h3>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl font-mono text-sm mb-4 border border-white/20">
                                {galenic.ingredients.join(' + ')}
                            </div>
                            <p className="text-xs opacity-90 italic">Preparazione esclusiva in Farmacia Centrale Montesilvano.</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={onRetake} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">Ripeti Test</button>
                    <button onClick={downloadTxt} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all transform active:scale-95">
                        <DownloadIcon className="w-5 h-5"/> Scarica Report (.txt)
                    </button>
                    <button onClick={onBackToHome} className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all">Home</button>
                </div>
            </div>
        </div>
    );
};

export default ResultsScreen;
