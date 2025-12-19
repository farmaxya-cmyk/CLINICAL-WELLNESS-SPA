
import React from 'react';
import { healthGoals } from '../data/healthGoalsData';
import { bloodTests, otherTests } from '../data/analysisData';
import { PHARMACY_EMAIL, PHARMACY_WHATSAPP_NUMBER } from '../data/constants';
import { getStoredJSON } from '../utils/storage';
import { SelectionSummary } from '../components/SelectionSummary';
import { BookingModal } from '../components/BookingModal';
import { DownloadIcon } from '../components/icons/DownloadIcon';

const goalToTestsMap: Record<string, string[]> = {
    'Rughe ed invecchiamento cutaneo': ['Skin Analysis', 'Skin Check (Dermatology)', 'Analisi DNA e Genomiche'],
    'Cellulite e ritenzione idrica': ['Esame Urine', 'Body Composition'],
    'Invecchiamento': ['Analisi DNA e Genomiche', 'Vitamina D', 'Profilo Lipidico Completo'],
    'Salute cardiovascolare': ['Profilo Lipidico Completo', 'ECG', 'Holter Pressorio', 'Holter ECG', 'Proteina C Reattiva'],
    'Insonnia': ['Test ed Analisi del Sonno', 'Cortisolo Salivare', 'Polisonnografia'],
    'Disturbi dell\'intestino': ['Intestino e Microbioma', 'Dietetica Intolleranze'],
    'Intolleranze alimentari ed allergie': ['Dietetica Intolleranze', 'Intestino e Microbioma'],
    'Migliorare la performance sportiva': ['Valutazione Training', 'Body Composition', 'HRV'],
    'Gambe pesanti e varici': ['Pletismografia', 'Esame Urine'],
    'Dimagrimento': ['Body Composition', 'Profilo Glucidico Completo', 'Metabolica (func. tiroide, ecc)'],
    'Attivita\' fisica': ['Valutazione Training', 'Body Composition', 'HRV', 'ECG'],
    'Ansia e Stress': ['Test dello Stress', 'Cortisolo Salivare', 'HRV'],
    'Ipertensione': ['Holter Pressorio', 'Profilo Lipidico Completo', 'ECG'],
    'Malattie della pelle': ['Skin Analysis', 'Skin Check (Dermatology)', 'Teledermatologia'],
    'Algie e Dolori': ['Valutazione Osteopatica', 'Proteina C Reattiva'],
    'Stanchezza': ['Vitamina D', 'Metabolica (func. tiroide, ecc)', 'Cortisolo Salivare'],
    'Benessere e felicita\'': ['Profilo Lipidico Completo', 'Vitamina D'],
    'Problemi posturali': ['Valutazione Osteopatica'],
    'Cistiti ricorrenti': ['Esame Urine'],
};

const allTestsMap = new Map();
[...bloodTests, ...otherTests].forEach(test => allTestsMap.set(test.name, test));

const AnalysisQuoteScreen = ({ user, showNotification, onNavigate }) => {
    const [selection, setSelection] = React.useState<any[]>([]);
    const [selectedGoals, setSelectedGoals] = React.useState<Set<string>>(new Set());
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
    const [showAnalysisSection, setShowAnalysisSection] = React.useState(false);

    const handleDownloadTxt = () => {
        if (selection.length === 0) return;
        const total = selection.reduce((acc, s) => acc + (s.price || 0), 0);
        let txt = `=================================================\n`;
        txt += `   CLINICAL WELLNESS SPA - PIANO ANALISI\n`;
        txt += `=================================================\n\n`;
        txt += `UTENTE: ${user.name}\n`;
        txt += `DATA: ${new Date().toLocaleDateString('it-IT')}\n\n`;
        txt += `OBIETTIVI SELEZIONATI:\n`;
        Array.from(selectedGoals).forEach(g => txt += `- ${g}\n`);
        txt += `\nANALISI CONSIGLIATE:\n`;
        selection.forEach(s => txt += `- ${s.name} (${s.price > 0 ? s.price + '€' : s.label || 'da definire'})\n`);
        txt += `\nTOTALE STIMATO: ${total}€\n`;
        txt += `\n-------------------------------------------------\n`;
        txt += `Presenta questo elenco in Farmacia Centrale\nper pianificare l'esecuzione dei test.\n`;
        txt += `=================================================\n`;

        const blob = new Blob(["\uFEFF" + txt], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Piano_Analisi_${Date.now()}.txt`;
        link.click();
    };

    const handleGoalToggle = (goal: string) => {
        const newGoals = new Set(selectedGoals);
        if (newGoals.has(goal)) newGoals.delete(goal);
        else newGoals.add(goal);
        setSelectedGoals(newGoals);
    };

    const handleSelectItem = (item: any) => {
        setSelection(prev => {
            const isSelected = prev.some(s => s.id === item.name);
            if (isSelected) return prev.filter(s => s.id !== item.name);
            else return [...prev, { id: item.name, name: item.name, price: item.price, label: item.label }];
        });
    };

    const handleEvaluate = () => {
        const recommendedTestNames = new Set<string>();
        selectedGoals.forEach(goal => (goalToTestsMap[goal] || []).forEach(t => recommendedTestNames.add(t)));
        const recommendedSelection = Array.from(recommendedTestNames).map(name => {
            const t = allTestsMap.get(name);
            return t ? { id: t.name, name: t.name, price: t.price, label: t.label } : null;
        }).filter(Boolean);
        setSelection(recommendedSelection as any[]);
        setShowAnalysisSection(true);
    };

    const totalPrice = selection.reduce((acc, item) => acc + (item.price || 0), 0);

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Analisi & Preventivi</h1>
            <p className="text-xl text-slate-600 mb-8">Definisci i tuoi obiettivi per un piano personalizzato.</p>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                 <h2 className="text-2xl font-bold text-slate-700 mb-4">1. Scegli i tuoi obiettivi</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                     {healthGoals.map(goal => (
                        <button key={goal} onClick={() => handleGoalToggle(goal)} className={`px-3 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${selectedGoals.has(goal) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-300 hover:border-sky-500'}`}>{goal}</button>
                     ))}
                 </div>
                 <div className="mt-6 flex justify-center">
                    <button onClick={handleEvaluate} disabled={selectedGoals.size === 0} className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 disabled:bg-slate-400">Genera Piano Analisi</button>
                 </div>
            </div>
            
            {showAnalysisSection && (
                <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-slate-700">2. Esami Consigliati</h2>
                        <button onClick={handleDownloadTxt} className="flex items-center gap-2 text-emerald-600 font-bold hover:underline">
                            <DownloadIcon className="w-5 h-5"/> Scarica Elenco (.txt)
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2">Analisi Sangue</h3>
                            <div className="space-y-1">
                                {bloodTests.map(test => <div key={test.name} onClick={() => handleSelectItem(test)} className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${selection.some(s => s.id === test.name) ? 'bg-sky-100' : 'hover:bg-slate-50'}`}><span className="text-sm">{test.name}</span><span className="font-semibold">{test.price}€</span></div>)}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2">Altre Analisi</h3>
                            <div className="space-y-1">
                                {otherTests.map(test => <div key={test.name} onClick={() => handleSelectItem(test)} className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${selection.some(s => s.id === test.name) ? 'bg-sky-100' : 'hover:bg-slate-50'}`}><span className="text-sm">{test.name}</span><span className="font-semibold">{test.label || `${test.price}€`}</span></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {selection.length > 0 && <SelectionSummary selection={selection} total={totalPrice} onProceed={() => setIsBookingModalOpen(true)} />}
            <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} selection={selection} user={user} onConfirmByEmail={() => {}} onConfirmByWhatsApp={() => {}} />
        </div>
    );
};
export default AnalysisQuoteScreen;
