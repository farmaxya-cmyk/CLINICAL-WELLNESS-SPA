import React from 'react';
import { XIcon } from './icons/XIcon';
import { MailIcon } from './icons/MailIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

export const BookingModal = ({ isOpen, onClose, selection, user, onConfirmByEmail, onConfirmByWhatsApp }) => {
    if (!isOpen) return null;

    const [date, setDate] = React.useState('');
    const [time, setTime] = React.useState('');
    const [error, setError] = React.useState('');
    const today = new Date().toISOString().split('T')[0];

    const handleConfirm = (method) => {
        setError('');
        if (!date || !time) {
            setError("Per favore, seleziona sia una data che un orario.");
            return;
        }
        if (date < today) {
            setError("La data selezionata non può essere nel passato.");
            return;
        }
        
        if (method === 'email') onConfirmByEmail(date, time);
        else if (method === 'whatsapp') onConfirmByWhatsApp(date, time);
    };

    const totalPrice = selection.reduce((acc, item) => acc + (item.price || 0), 0);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-transform animate-slide-in-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-800">Completa la tua Richiesta</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="font-semibold text-slate-700 mb-2">Riepilogo Servizi:</h3>
                        <ul className="space-y-1 text-slate-600 max-h-32 overflow-y-auto bg-slate-50 p-3 rounded-md">
                            {selection.map(item => <li key={item.id}>- {item.name}</li>)}
                        </ul>
                        <p className="text-right font-bold text-slate-800 mt-2">Totale: {totalPrice}€</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-700 mb-3">Scegli la tua preferenza di appuntamento:</h3>
                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded-md" role="alert"><p>{error}</p></div>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="booking-date" className="block text-sm font-medium text-slate-600 mb-1">Data</label>
                                <input type="date" id="booking-date" min={today} value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                            </div>
                            <div>
                                <label htmlFor="booking-time" className="block text-sm font-medium text-slate-600 mb-1">Orario</label>
                                <input type="time" id="booking-time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-b-2xl flex flex-col sm:flex-row justify-end items-center gap-3">
                     <button onClick={() => handleConfirm('email')} className="w-full sm:w-auto px-5 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2">
                         <MailIcon className="w-5 h-5" /> Invia via Email
                    </button>
                    <button onClick={() => handleConfirm('whatsapp')} className="w-full sm:w-auto px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                         <WhatsAppIcon className="w-5 h-5" /> Invia via WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};
