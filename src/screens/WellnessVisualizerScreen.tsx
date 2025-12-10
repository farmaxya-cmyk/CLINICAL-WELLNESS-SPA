import React from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ImageIcon } from '../components/icons/ImageIcon';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';

const PRESET_PROMPTS = [
    "Un piatto sano e colorato con salmone, avocado e quinoa, fotografia professionale food",
    "Una tranquilla spiaggia tropicale al tramonto per meditazione, vista cinematografica",
    "Una moderna palestra luminosa con vista sulla natura, architettura d'interni",
    "Un frullato detox verde con spinaci e mela su un tavolo di legno, luce naturale",
    "Una persona che fa yoga in cima a una montagna serena, atmosfera ispirazionale"
];

export const WellnessVisualizerScreen = () => {
    const [prompt, setPrompt] = React.useState('');
    const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Enhance prompt for better visual results
            const enhancedPrompt = `${prompt}, photorealistic, 8k, highly detailed, professional photography, wellness aesthetic, soft lighting, cinematic composition`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [
                        { text: enhancedPrompt }
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            // Iterate through parts to find the image, as per SDK guidelines
            let base64Image = null;
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }
            }

            if (base64Image) {
                setGeneratedImage(`data:image/png;base64,${base64Image}`);
            } else {
                setError("L'IA ha generato una risposta, ma non contiene un'immagine valida. Riprova con una descrizione diversa.");
            }

        } catch (err: any) {
            console.error("Generation error:", err);
            let errorMsg = "Si è verificato un errore durante la generazione.";
            if (err.message?.includes('403') || err.message?.includes('permission')) {
                errorMsg = "Errore di permessi API. Verifica che la tua chiave supporti la generazione di immagini.";
            } else if (err.message?.includes('429')) {
                errorMsg = "Limite di richieste raggiunto. Attendi qualche istante.";
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32 max-w-6xl mx-auto">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center justify-center md:justify-start gap-3">
                    <ImageIcon className="w-10 h-10 text-purple-600" />
                    Visualizzatore Obiettivi
                </h1>
                <p className="text-xl text-slate-600">
                    Materializza i tuoi obiettivi di benessere. Descrivi ciò che vuoi vedere e l'IA lo creerà per te.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Controls Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
                        <label className="block text-sm font-bold text-slate-700 mb-2">La tua visione</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Es: Una colazione sana con frutta fresca su un balcone soleggiato..."
                            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-40 resize-none mb-4 text-slate-700 placeholder-slate-400"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-purple-500/30 hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Creazione in corso...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>Genera Immagine</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-md">
                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="text-xl">💡</span> Idee Rapide
                        </h3>
                        <div className="space-y-2">
                            {PRESET_PROMPTS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPrompt(p)}
                                    className="w-full text-left p-3 text-xs sm:text-sm text-slate-600 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors border border-slate-100 truncate"
                                    title={p}
                                >
                                    {p.split(',')[0]}...
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Result Column */}
                <div className="lg:col-span-8">
                    <div className="bg-slate-900 rounded-3xl shadow-2xl overflow-hidden min-h-[500px] h-full flex items-center justify-center relative border border-slate-800">
                        
                        {/* Background Pattern for empty state */}
                        {!generatedImage && !isLoading && !error && (
                             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        )}

                        {generatedImage ? (
                            <div className="relative w-full h-full animate-fade-in group flex items-center justify-center bg-black">
                                <img 
                                    src={generatedImage} 
                                    alt="Generated Wellness Visualization" 
                                    className="max-w-full max-h-[600px] object-contain shadow-2xl" 
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <p className="font-medium text-sm opacity-90 line-clamp-2">{prompt}</p>
                                </div>
                                <a 
                                    href={generatedImage} 
                                    download={`wellness-vision-${Date.now()}.png`}
                                    className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white p-3 rounded-full shadow-lg border border-white/20 transition-all transform hover:scale-110 hover:rotate-180 active:scale-95"
                                    title="Scarica Immagine"
                                >
                                    <UploadCloudIcon className="w-6 h-6" /> 
                                </a>
                            </div>
                        ) : (
                            <div className="text-center p-8 max-w-md relative z-10">
                                {isLoading ? (
                                    <div className="space-y-6">
                                        <div className="relative w-24 h-24 mx-auto">
                                            <div className="absolute inset-0 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                            <div className="absolute inset-4 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin reverse"></div>
                                            <SparklesIcon className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
                                        </div>
                                        <p className="text-purple-300 font-medium animate-pulse text-lg">L'Intelligenza Artificiale sta dipingendo la tua visione...</p>
                                    </div>
                                ) : error ? (
                                    <div className="text-red-400 bg-red-900/20 p-6 rounded-xl border border-red-900/50">
                                        <XCircleIcon className="w-12 h-12 mx-auto mb-3" />
                                        <p className="font-bold mb-2 text-lg">Impossibile Generare</p>
                                        <p className="text-sm opacity-80">{error}</p>
                                    </div>
                                ) : (
                                    <div className="text-slate-500">
                                        <div className="w-32 h-32 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                                            <ImageIcon className="w-16 h-16 text-slate-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-300 mb-3">Visualizza il tuo Benessere</h3>
                                        <p className="text-slate-400 leading-relaxed">Inserisci una descrizione nel pannello a sinistra e premi "Genera" per vedere la magia dell'IA in azione.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};