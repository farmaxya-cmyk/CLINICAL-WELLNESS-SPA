import React from 'react';
import { UsersIcon } from '../components/icons/UsersIcon';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { PHARMACY_WHATSAPP_NUMBER } from '../data/constants';

export const CommunityScreen = () => {
    // Link placeholder per il gruppo (da sostituire con il link reale di invito al gruppo WhatsApp)
    const GROUP_INVITE_LINK = `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=Vorrei%20unirmi%20al%20gruppo%20benessere!`;
    
    const handleJoinGroup = () => {
        window.open(GROUP_INVITE_LINK, '_blank');
    };

    const handleContactCoach = () => {
        window.open(`https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=Ciao,%20vorrei%20parlare%20con%20il%20Coach%20per%20una%20consulenza.`, '_blank');
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32 max-w-5xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-slate-800 mb-3">Community & Coaching</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Non sei solo nel tuo percorso. Unisciti alla nostra community per condividere esperienze o parla direttamente con i nostri esperti.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card 1: Il Gruppo (1-to-Many) */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                            <UsersIcon className="w-8 h-8 text-white" />
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-2">Gruppo Condivisione</h2>
                        <p className="text-emerald-100 mb-8 flex-grow">
                            Entra nel nostro gruppo esclusivo. Condividi i tuoi traguardi, scambia ricette e consigli sui livelli del percorso benessere. La motivazione nasce dalla condivisione!
                        </p>
                        
                        <button 
                            onClick={handleJoinGroup}
                            className="w-full bg-white text-emerald-600 font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <WhatsAppIcon className="w-5 h-5" />
                            Unisciti al Gruppo
                        </button>
                    </div>
                </div>

                {/* Card 2: Il Coach (1-to-1) */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-sky-100 opacity-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                            <SparklesIcon className="w-8 h-8 text-sky-600" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Il tuo Coach</h2>
                        <p className="text-slate-600 mb-8 flex-grow">
                            Hai dubbi su un esercizio? Vuoi personalizzare il tuo percorso o fissare un appuntamento 1-to-1? Parla direttamente con il tuo coach dedicato.
                        </p>
                        
                        <button 
                            onClick={handleContactCoach}
                            className="w-full bg-sky-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <WhatsAppIcon className="w-5 h-5" />
                            Chatta con il Coach
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="mt-12 bg-slate-100 rounded-xl p-6 text-center text-slate-500 text-sm">
                <p>
                    La comunicazione avviene tramite WhatsApp per garantirti la massima semplicità e privacy.
                    <br/>Il gruppo è moderato da professionisti di Clinical Wellness Spa.
                </p>
            </div>
        </div>
    );
};