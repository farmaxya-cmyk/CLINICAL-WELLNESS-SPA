import React from 'react';

export const SelectionSummary = ({ selection, onProceed, total }) => {
    const parseDurationInMinutes = (durationStr) => {
        if (!durationStr) return 0;
        let totalMinutes = 0;
        const parts = durationStr.split(' ');
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].includes('h')) totalMinutes += parseInt(parts[i], 10) * 60;
            else if (parts[i].includes('min')) totalMinutes += parseInt(parts[i], 10);
        }
        return totalMinutes;
    };

    const formatMinutes = (totalMinutes) => {
        if (totalMinutes === 0) return 'N/A';
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}min`;
        return result.trim();
    };

    const totalPrice = total !== undefined ? total : selection.reduce((acc, item) => acc + item.price, 0);
    const totalDurationInMinutes = selection.reduce((acc, item) => acc + parseDurationInMinutes(item.duration), 0);
    const formattedTotalDuration = formatMinutes(totalDurationInMinutes);

    return (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-slate-800 text-white p-4 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.2)] z-20 animate-slide-in-bottom">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex-grow text-center sm:text-left">
                    <h3 className="font-bold text-lg">{selection.length} Servizi Selezionati</h3>
                    <div className="flex gap-4 text-sky-200 text-sm">
                        {totalDurationInMinutes > 0 && <span>Durata Totale: <span className="font-semibold text-white">{formattedTotalDuration}</span></span>}
                        <span>Costo Totale: <span className="font-semibold text-white">{totalPrice}€</span></span>
                    </div>
                </div>
                <button onClick={onProceed} className="bg-sky-500 font-semibold py-2 px-6 rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2">
                    <span>Richiedi Appuntamento</span>
                </button>
            </div>
        </div>
    );
};
