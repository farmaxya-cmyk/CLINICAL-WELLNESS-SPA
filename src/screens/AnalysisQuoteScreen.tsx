import React from 'react';
import { healthGoals } from '../data/healthGoalsData';
import { bloodTests, otherTests } from '../data/analysisData';
import { PHARMACY_EMAIL, PHARMACY_WHATSAPP_NUMBER } from '../data/constants';
import { getStoredJSON } from '../utils/storage';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { SelectionSummary } from '../components/SelectionSummary';
import { BookingModal } from '../components/BookingModal';

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
    const [bookingHistory, setBookingHistory] = React.useState([]);
    const [showAnalysisSection, setShowAnalysisSection] = React.useState(false);
    const [recommendedTests, setRecommendedTests] = React.useState<any[]>([]);

    const getStoredBookings = React.useCallback(() => getStoredJSON('spaBookings', []), []);

    React.useEffect(() => {
        const userHistory = getStoredBookings().filter(b => b.userEmail === user.email && b.type === 'analysis').sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
        setBookingHistory(userHistory);
    }, [user.email, getStoredBookings]);

    const handleGoalToggle = (goal: string) => {
        const newGoals = new Set(selectedGoals);
        if (newGoals.has(goal)) {
            newGoals.delete(goal);
        } else {
            newGoals.add(goal);
        }
        setSelectedGoals(newGoals);
    };

    const handleSelectItem = (item: { name: string, price: number, label?: string }) => {
        setSelection(prev => {
            const isSelected = prev.some(s => s.id === item.name);
            if (isSelected) return prev.filter(s => s.id !== item.name);
            else return [...prev, { id: item.name, name: item.name, price: item.price, duration: null, label: item.label }];
        });
    };
    
    const handleUpdateBookingStatus = (id, newStatus) => {
        const allBookings = getStoredBookings();
        const updatedAllBookings = allBookings.map(b => (b.id === id ? { ...b, status: newStatus } : b));
        localStorage.setItem('spaBookings', JSON.stringify(updatedAllBookings));
        setBookingHistory(prev => prev.map(b => (b.id === id ? { ...b, status: newStatus } : b)));
        showNotification('Appuntamento segnato come confermato!', 'success');
    };

    const handleDeleteBooking = (id) => {
        if (confirm("Sei sicuro di voler annullare questa richiesta?")) {
            const allBookings = getStoredBookings();
            const updatedAllBookings = allBookings.filter(b => b.id !== id);
            localStorage.setItem('spaBookings', JSON.stringify(updatedAllBookings));
            const updatedUserHistory = updatedAllBookings.filter(b => b.userEmail === user.email && b.type === 'analysis').sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime());
            setBookingHistory(updatedUserHistory);
            showNotification('Richiesta annullata.', 'success');
        }
    };

    const createBookingRequest = (date, time, method) => {
        const newBooking = { id: new Date().getTime(), userEmail: user.email, userName: user.name, services: selection, requestedDate: date, requestedTime: time, totalPrice: selection.reduce((acc, item) => item.price > 0 ? acc + item.price : acc, 0), status: 'pending', dateSubmitted: new Date().toISOString(), type: 'analysis' };
        const allBookings = getStoredJSON('spaBookings', []);
        localStorage.setItem('spaBookings', JSON.stringify([...allBookings, newBooking]));
        setBookingHistory(prev => [newBooking, ...prev]);
        const servicesText = selection.map(s => `- ${s.name} (${s.price > 0 ? `${s.price}€` : s.label || 'da definire'})`).join('\n');
        const details = `Richiesta di preventivo/appuntamento per analisi da: ${user.name} (${user.email})\nData richiesta: ${new Date(date).toLocaleDateString('it-IT')}\nOra richiesta: ${time}\n\nAnalisi Richieste:\n${servicesText}\n\nTotale (preliminare): ${newBooking.totalPrice}€`.trim();
        if (method === 'email') window.open(`mailto:${PHARMACY_EMAIL}?subject=${encodeURIComponent(`Richiesta Analisi & Preventivo - ${user.name}`)}&body=${encodeURIComponent(details)}`, '_blank');
        else if (method === 'whatsapp') window.open(`https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(details)}`, '_blank');
        setIsBookingModalOpen(false); setSelection([]); showNotification('La tua richiesta è pronta per essere inviata!');
    };

    const handleEvaluate = () => {
        const recommendedTestNames = new Set<string>();
        selectedGoals.forEach(goal => {
            const testsForGoal = goalToTestsMap[goal] || [];
            testsForGoal.forEach(testName => recommendedTestNames.add(testName));
        });

        const recommendedSelection = Array.from(recommendedTestNames).map(testName => {
            const test = allTestsMap.get(testName);
            if (!test) return null;
            return { id: test.name, name: test.name, price: test.price, duration: null, label: test.label };
        }).filter(Boolean);

        setRecommendedTests(recommendedSelection as any[]);
        setSelection(recommendedSelection as any[]);
        setShowAnalysisSection(true);
    };

    const totalPrice = selection.reduce((acc, item) => item.price > 0 ? acc + item.price : acc, 0);
    const StatusChip = ({ status }) => {
        const styles = { pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' };
        const text = { pending: 'In attesa', confirmed: 'Confermato', rejected: 'Rifiutata' };
        return <span className={`px-3 py-1 text-sm font-bold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{text[status] || 'Sconosciuto'}</span>;
    };

    const bloodTestNamesSet = new Set(bloodTests.map(t => t.name));
    const recommendedBloodTests = recommendedTests.filter(t => bloodTestNamesSet.has(t.name));
    const recommendedOtherTests = recommendedTests.filter(t => !bloodTestNamesSet.has(t.name));


    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Analisi & Preventivi</h1>
            <p className="text-xl text-slate-600 mb-8">Seleziona i tuoi obiettivi per ricevere un consiglio sulle analisi da fare.</p>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                 <h2 className="text-2xl font-bold text-slate-700 mb-4">1. Scegli i tuoi obiettivi di salute</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                     {healthGoals.map(goal => (
                        <button 
                            key={goal}
                            onClick={() => handleGoalToggle(goal)}
                            className={`px-3 py-3 text-sm font-semibold rounded-lg border-2 transition-colors w-full h-full text-center flex items-center justify-center ${selectedGoals.has(goal) ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-300 hover:border-sky-500 hover:bg-sky-50'}`}
                        >
                           {goal}
                        </button>
                     ))}
                 </div>
                 <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleEvaluate}
                        disabled={selectedGoals.size === 0}
                        className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                        aria-label="Valuta obiettivi selezionati"
                    >
                        Valuta
                    </button>
                 </div>
            </div>
            
            {showAnalysisSection && (
                <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">2. Analisi Consigliate</h2>
                     <p className="text-slate-500 mb-6">In base ai tuoi obiettivi, ti consigliamo le seguenti analisi. Puoi deselezionare quelle che non ti interessano prima di procedere.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2">Analisi del Sangue</h3>
                             <div className="space-y-1">
                                {recommendedBloodTests.length > 0 ? recommendedBloodTests.map(test => <div key={test.name} onClick={() => handleSelectItem(test)} className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${selection.some(s => s.id === test.name) ? 'bg-sky-100' : 'hover:bg-slate-50'}`}><span className="font-medium text-slate-700 text-sm">{test.name}</span><span className="font-semibold text-sky-700 text-sm">{test.price}€</span></div>)
                                : <p className="text-sm text-slate-500 italic">Nessuna analisi del sangue consigliata per questi obiettivi.</p>}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-slate-800 mb-3 border-b pb-2">Altre Analisi</h3>
                            <div className="space-y-1">
                                {recommendedOtherTests.length > 0 ? recommendedOtherTests.map(test => <div key={test.name} onClick={() => handleSelectItem(test)} className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${selection.some(s => s.id === test.name) ? 'bg-sky-100' : 'hover:bg-slate-50'}`}><span className="font-medium text-slate-700 text-sm">{test.name}</span><span className="font-semibold text-sky-700 text-sm">{test.label || `${test.price}€`}</span></div>)
                                : <p className="text-sm text-slate-500 italic">Nessun'altra analisi consigliata per questi obiettivi.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            <div className="mt-12">
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Le Tue Richieste</h2>
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    {bookingHistory.length > 0 ? (
                        <ul className="space-y-4">
                            {bookingHistory.map(booking => (
                                <li key={booking.id} className="bg-slate-50 p-4 rounded-lg">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div>
                                            <p className="font-bold text-slate-800">Richiesta per il {new Date(booking.requestedDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })} alle {booking.requestedTime}</p>
                                            <p className="text-xs text-slate-500 mt-1">Inviata il: {new Date(booking.dateSubmitted).toLocaleString('it-IT')}</p>
                                        </div>
                                        <div className="self-start sm:self-center flex-shrink-0"><StatusChip status={booking.status} /></div>
                                    </div>
                                    <div className="mt-4 border-t border-slate-200 pt-3">
                                        <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">{booking.services.map(s => <li key={s.id}>{s.name}</li>)}</ul>
                                        <p className="text-right font-bold text-slate-800 mt-3">Totale: {booking.totalPrice}€</p>
                                    </div>
                                    {booking.status === 'pending' && (
                                        <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-end gap-3">
                                            <button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')} className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-100"><CheckCircleIcon className="w-5 h-5"/><span>Confermato</span></button>
                                            <button onClick={() => handleDeleteBooking(booking.id)} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100"><XCircleIcon className="w-5 h-5"/><span>Annulla</span></button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-slate-500 py-8">Non hai ancora inviato richieste di analisi.</p>}
                </div>
            </div>
            {selection.length > 0 && <SelectionSummary selection={selection} total={totalPrice} onProceed={() => setIsBookingModalOpen(true)} />}
            <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} selection={selection} user={user} onConfirmByEmail={(date, time) => createBookingRequest(date, time, 'email')} onConfirmByWhatsApp={(date, time) => createBookingRequest(date, time, 'whatsapp')} />
        </div>
    );
};
export default AnalysisQuoteScreen;