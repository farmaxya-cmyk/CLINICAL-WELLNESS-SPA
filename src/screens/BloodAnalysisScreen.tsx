
import React from 'react';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';

const BloodAnalysisScreen = ({ user }) => {
    
    return (
        <div className="p-4 md:p-8 animate-fade-in relative">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Analisi Referti Sanguigni con AI</h1>
            <p className="text-xl text-slate-600 mb-8">Carica una foto del tuo referto per ottenere un'analisi dettagliata.</p>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-sky-500 text-center max-w-md mx-4">
                    <SparklesIcon className="w-16 h-16 text-sky-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Presto Attivo!</h2>
                    <p className="text-slate-600 mb-6">
                        Stiamo perfezionando l'Intelligenza Artificiale per offrirti un'analisi clinica ancora più precisa. Questa funzionalità sarà disponibile nel prossimo aggiornamento.
                    </p>
                    <button className="bg-slate-200 text-slate-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                        Coming Soon
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-50 pointer-events-none">
                {/* Upload and Preview Column (Disabled UI) */}
                <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">1. Carica il tuo referto</h2>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-12 text-center flex-grow flex flex-col justify-center">
                         <div className="flex flex-col items-center text-slate-500">
                            <UploadCloudIcon className="w-12 h-12 mb-2" />
                            <p className="font-semibold">Trascina un file qui o clicca per caricare</p>
                            <p className="text-sm">Immagini (PNG, JPG) o PDF</p>
                        </div>
                    </div>
                </div>

                {/* Analysis Result Column (Disabled UI) */}
                <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-700">2. Risultati dell'Analisi</h2>
                    </div>
                     <div className="text-center text-slate-500 py-16">
                        <FileTextIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <p>I risultati della tua analisi appariranno qui.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BloodAnalysisScreen;
