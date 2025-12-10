
import React from 'react';
import { GoogleGenAI } from '@google/genai';
import { SleepIcon } from './icons/SleepIcon';
import { StressIcon } from './icons/StressIcon';
import { MicrobiomeIcon } from './icons/MicrobiomeIcon';
import { FitnessIcon } from './icons/FitnessIcon';
import { DietIcon } from './icons/DietIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { XIcon } from './icons/XIcon';
import { MailIcon } from './icons/MailIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { marked } from 'marked';
import { PHARMACY_EMAIL, PHARMACY_WHATSAPP_NUMBER } from '../data/constants';

// Ricette statiche di fallback per ogni giorno della settimana
const WEEKLY_RECIPES = [
    {
        day: 0, // Domenica
        title: "Risotto all'Ortica e Noci",
        benefits: ["Depurativo", "Ricco di Ferro", "Energizzante"],
        content: `
### Ingredienti
*   320g Riso Carnaroli o Integrale
*   200g Punte di Ortica fresca (solo le cime tenere)
*   50g Noci tritate
*   Brodo vegetale q.b.
*   Olio EVO e Parmigiano (facoltativo)

### Procedimento
1.  Lavare le ortiche (usando guanti) e sbollentarle per 2 minuti. Scolarle e frullarle grossolanamente.
2.  Tostare il riso con un filo d'olio, sfumare con brodo vegetale.
3.  A metà cottura aggiungere la crema di ortiche.
4.  Mantecare a fuoco spento con olio EVO e guarnire con le noci tritate per dare croccantezza e Omega-3.
        `
    },
    {
        day: 1, // Lunedì
        title: "Insalata di Tarassaco e Uova in Camicia",
        benefits: ["Drenante epatico", "Proteico", "Digestivo"],
        content: `
### Ingredienti
*   Mazzetto di Tarassaco fresco (foglie giovani)
*   2 Uova fresche
*   Aceto di mele
*   Semi di girasole
*   Olio EVO, sale, pepe

### Procedimento
1.  Lavare accuratamente il tarassaco e asciugarlo. Spezzettarlo in una ciotola.
2.  Preparare le uova in camicia in acqua bollente acidulata con aceto (3-4 minuti).
3.  Condire il tarassaco con olio, sale e una spruzzata di aceto di mele.
4.  Adagiare le uova sull'insalata e cospargere con semi di girasole tostati.
        `
    },
    {
        day: 2, // Martedì
        title: "Frittata di Borragine al Forno",
        benefits: ["Antinfiammatorio", "Ricco di acidi grassi", "Leggero"],
        content: `
### Ingredienti
*   4 Uova
*   150g Foglie di Borragine
*   1 Cipollotto
*   Curcuma in polvere
*   Olio EVO

### Procedimento
1.  Lessare la borragine per pochi minuti, strizzarla bene e tritarla.
2.  Sbattere le uova con un pizzico di sale e mezzo cucchiaino di curcuma.
3.  Unire la borragine e il cipollotto tritato fine.
4.  Versare in una teglia foderata di carta forno. Cuocere a 180°C per 20 minuti circa.
        `
    },
    {
        day: 3, // Mercoledì
        title: "Pesto di Portulaca e Mandorle su Farro",
        benefits: ["Ricchissimo di Omega-3", "Rinfrescante", "Energia a lento rilascio"],
        content: `
### Ingredienti
*   200g Farro perlato o decorticato
*   Mazzetto abbondante di Portulaca (foglie e gambi teneri)
*   50g Mandorle pelate
*   Aglio (facoltativo), Olio EVO
*   Scorza di limone

### Procedimento
1.  Cuocere il farro in acqua salata e lasciarlo raffreddare.
2.  Nel mortaio o mixer, pestare la portulaca cruda con le mandorle, olio e poco aglio fino a ottenere una crema grezza.
3.  Condire il farro con il pesto e grattugiare scorza di limone fresco sopra.
        `
    },
    {
        day: 4, // Giovedì
        title: "Zuppa di Malva e Patate Dolci",
        benefits: ["Lenitivo per l'intestino", "Emolliente", "Carboidrati complessi"],
        content: `
### Ingredienti
*   Foglie e fiori di Malva
*   2 Patate dolci medie
*   1 Porro
*   Zenzero fresco
*   Olio EVO

### Procedimento
1.  Stufare il porro affettato con un filo d'olio e zenzero grattugiato.
2.  Aggiungere le patate dolci a cubetti e coprire con acqua/brodo. Cuocere 15 min.
3.  Aggiungere la malva lavata e cuocere altri 5 minuti.
4.  Frullare parzialmente per ottenere una consistenza cremosa ma con pezzi.
        `
    },
    {
        day: 5, // Venerdì
        title: "Filetto di Sgombro con Finocchietto Selvatico",
        benefits: ["Omega-3", "Digestivo", "Depurativo"],
        content: `
### Ingredienti
*   Filetti di Sgombro fresco
*   Mazzetto di Finocchietto selvatico
*   Arancia biologica
*   Olive taggiasche

### Procedimento
1.  Disporre i filetti in una pirofila.
2.  Preparare un'emulsione con olio, succo d'arancia e finocchietto tritato.
3.  Spennellare il pesce, aggiungere le olive e fettine d'arancia.
4.  Cuocere in forno a 180°C per 10-15 minuti.
        `
    },
    {
        day: 6, // Sabato
        title: "Cicoria Ripassata con Peperoncino e Aglio",
        benefits: ["Amaro digestivo", "Stimolante metabolico", "Detox"],
        content: `
### Ingredienti
*   Cicoria di campo o catalogna
*   Aglio, Peperoncino
*   Olio EVO
*   Pane integrale tostato

### Procedimento
1.  Sbollentare la cicoria in acqua salata, scolarla e strizzarla bene (conservare un po' d'acqua di cottura se piace l'amaro).
2.  In padella, rosolare aglio e peperoncino in olio EVO.
3.  Aggiungere la cicoria e farla insaporire a fuoco vivace per 5 minuti.
4.  Servire su fette di pane integrale tostato strofinato con aglio.
        `
    }
];

interface Props {
    customSleepFormulation?: {
        ingredients: string[];
        dosage: string;
        phases: string[];
    } | null;
}

export const FunctionalFoodMap: React.FC<Props> = ({ customSleepFormulation }) => {
    const [recipe, setRecipe] = React.useState<{title: string, content: string, benefits: string[]} | null>(null);
    const [loadingRecipe, setLoadingRecipe] = React.useState(false);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const pillars = [
        {
            id: 'sleep',
            title: 'Sonno',
            icon: SleepIcon,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
            foods: [
                { name: 'Kiwi', desc: 'Serotonina' },
                { name: 'Mandorle', desc: 'Magnesio' },
                { name: 'Yogurt', desc: 'Triptofano' }
            ],
            supplements: 'Melatonina, Magnesio, L-teanina',
            emoji: '😴'
        },
        {
            id: 'stress',
            title: 'Ansia & Stress',
            icon: StressIcon,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            foods: [
                { name: 'Tè Verde', desc: 'EGCG calmante' },
                { name: 'Cioccolato 70%', desc: 'Flavonoidi' },
                { name: 'Semi di Zucca', desc: 'Zinco' }
            ],
            supplements: 'Ashwagandha, Rhodiola, Magnesio',
            emoji: '🧘'
        },
        {
            id: 'microbiome',
            title: 'Microbioma',
            icon: MicrobiomeIcon,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            foods: [
                { name: 'Kefir/Yogurt', desc: 'Probiotici' },
                { name: 'Legumi', desc: 'Prebiotici' },
                { name: 'Verdure Ferm.', desc: 'Diversità' }
            ],
            supplements: 'Probiotici multiceppo, Inulina',
            emoji: '🌱'
        },
        {
            id: 'activity',
            title: 'Attività Fisica',
            icon: FitnessIcon,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            foods: [
                { name: 'Banane', desc: 'Potassio rapido' },
                { name: 'Uova', desc: 'Proteine nobili' },
                { name: 'Pesce Azzurro', desc: 'Recupero' }
            ],
            supplements: 'Proteine Whey, Creatina, BCAA',
            emoji: '🏃'
        },
        {
            id: 'diet',
            title: 'Nutrizione Base',
            icon: DietIcon,
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            border: 'border-sky-100',
            foods: [
                { name: 'Frutta/Verdura', desc: 'Polifenoli' },
                { name: 'Cereali Int.', desc: 'Energia stabile' },
                { name: 'Olio EVO', desc: 'Grassi sani' }
            ],
            supplements: 'Multivitaminico, Vitamina D',
            emoji: '🍎'
        }
    ];

    // Formulazioni di base
    const baseFormulations = [
        {
            name: "Formulazione Zen Night",
            target: "Sonno & Stress",
            ingredients: "Melatonina, Escolzia, Magnesio Bisglicinato",
            desc: "Indicata per chi ha difficoltà ad addormentarsi a causa di pensieri ricorrenti.",
            isCustom: false
        },
        {
            name: "Formulazione Gut Repair",
            target: "Microbioma & Digestione",
            ingredients: "L-Glutammina, Boswellia, Curcuma Fitosoma",
            desc: "Supporto mirato per la permeabilità intestinale e stati infiammatori.",
            isCustom: false
        },
        {
            name: "Formulazione Energy React",
            target: "Stanchezza Fisica & Mentale",
            ingredients: "Rodiola Rosea, Vitamine B Coenzimate, Coenzima Q10",
            desc: "Sostegno energetico senza caffeina per periodi di forte carico lavorativo o sportivo.",
            isCustom: false
        }
    ];

    // Logica di sostituzione: Se esiste customSleepFormulation, sovrascrivi la prima card (Zen Night)
    const displayFormulations = [...baseFormulations];
    
    if (customSleepFormulation) {
        displayFormulations[0] = {
            name: "Formulazione Galenica Personalizzata",
            target: `Sonno (Target: ${customSleepFormulation.phases.join(', ')})`,
            ingredients: customSleepFormulation.ingredients.join(', '),
            desc: `Basata sul tuo test. Posologia: ${customSleepFormulation.dosage}`,
            isCustom: true
        };
    }

    const generateDailyRecipe = async () => {
        setLoadingRecipe(true);
        setRecipe(null);
        
        // Logica ibrida: Prima prova API, se fallisce usa DB statico basato sul giorno
        const dayOfWeek = new Date().getDay(); // 0-6
        const staticRecipe = WEEKLY_RECIPES[dayOfWeek];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Crea una ricetta del giorno sana, bilanciata e gustosa, ideale per migliorare il benessere generale. 
            Includi obbligatoriamente un'erba spontanea commestibile (es. tarassaco, ortica, borragine, malva, portulaca) tipica della tradizione.
            La ricetta deve essere facile da preparare.
            
            IMPORTANTE: Rispondi SOLO con un oggetto JSON valido (senza markdown \`\`\`json) con questa struttura:
            {
                "title": "Nome Ricetta",
                "benefits": ["beneficio 1", "beneficio 2"],
                "content": "Testo completo in markdown con Ingredienti e Procedimento"
            }`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: { responseMimeType: "application/json" }
            });
            
            const rawText = response.text || "";
            const jsonText = rawText.trim();
            // Pulisci eventuali residui di markdown se il modello non obbedisce perfettamente
            const cleanJson = jsonText.replace(/^```json/, '').replace(/```$/, '');
            const parsed = JSON.parse(cleanJson);
            
            setRecipe(parsed);
            setIsModalOpen(true);

        } catch (e) {
            console.warn("AI generation failed, falling back to static recipe:", e);
            // Fallback
            setRecipe({
                title: staticRecipe.title,
                benefits: staticRecipe.benefits,
                content: staticRecipe.content
            });
            setIsModalOpen(true);
        } finally {
            setLoadingRecipe(false);
        }
    };

    const handleGalenicConsultation = (method: 'email' | 'whatsapp', formName?: string) => {
        const text = formName 
            ? `Buongiorno, vorrei richiedere informazioni sulla preparazione della: ${formName}.`
            : "Buongiorno, vorrei richiedere una consulenza per una formulazione galenica personalizzata.";
            
        if (method === 'email') {
            window.open(`mailto:${PHARMACY_EMAIL}?subject=Richiesta Galenica: ${formName || 'Consulenza'}&body=${text}`, '_blank');
        } else {
            window.open(`https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <SparklesIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Mappa Alimentare Funzionale</h2>
                            <p className="text-slate-500 text-sm">Nutrizione strategica e integrazione mirata per i 5 Pilastri della salute.</p>
                        </div>
                    </div>
                    <button 
                        onClick={generateDailyRecipe}
                        disabled={loadingRecipe}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        {loadingRecipe ? "Elaborazione Chef AI..." : "Genera Ricetta del Giorno"}
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {pillars.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col h-full group">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{item.emoji}</span>
                                <h3 className={`font-bold ${item.color}`}>{item.title}</h3>
                            </div>

                            <div className="mb-4 flex-grow">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nel piatto</p>
                                <ul className="space-y-2">
                                    {item.foods.map((food, idx) => (
                                        <li key={idx} className="flex flex-col text-sm">
                                            <span className="font-semibold text-slate-700">{food.name}</span>
                                            <span className="text-xs text-slate-500">{food.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className={`mt-auto p-3 rounded-xl ${item.bg} border ${item.border}`}>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Integrazione</p>
                                <p className={`text-xs font-medium ${item.color} leading-snug`}>
                                    {item.supplements}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Galenic Laboratory Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <BeakerIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Laboratorio Galenico & Integrazione Personalizzata</h2>
                            <p className="text-slate-500 text-sm">Formulazioni su misura preparate dai nostri farmacisti specializzati.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 mb-6 text-sm">
                        Ogni persona è unica. Presso la Farmacia Centrale Montesilvano, possiamo creare integratori dosati sulle tue specifiche necessità analizzando i tuoi test. <br/>
                        <span className="italic text-xs text-slate-400">*Nota: Le formulazioni qui proposte sono esempi di preparati officinali o integratori personalizzabili. Le quantità saranno definite dal farmacista in base alle normative vigenti.</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {displayFormulations.map((form, i) => (
                            <div 
                                key={i} 
                                className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md cursor-pointer relative overflow-hidden ${form.isCustom ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-slate-200'}`}
                                onClick={() => handleGalenicConsultation('whatsapp', form.name)}
                            >
                                {form.isCustom && (
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                        SU MISURA
                                    </div>
                                )}
                                <span className={`text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block ${form.isCustom ? 'text-indigo-700 bg-white' : 'text-indigo-600 bg-indigo-50'}`}>
                                    {form.target}
                                </span>
                                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                    {form.name}
                                    {form.isCustom && <SparklesIcon className="w-4 h-4 text-indigo-500" />}
                                </h3>
                                <p className="text-xs text-slate-500 italic mb-3">{form.ingredients}</p>
                                <p className="text-sm text-slate-600">{form.desc}</p>
                                <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-end">
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                                        Richiedi info <WhatsAppIcon className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-slate-100 pt-6">
                        <span className="text-sm font-semibold text-slate-600">Non trovi quello che cerchi?</span>
                        <button 
                            onClick={() => handleGalenicConsultation('email')}
                            className="flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-lg font-bold hover:bg-sky-200 transition-colors text-sm"
                        >
                            <MailIcon className="w-4 h-4" /> Consulenza Email
                        </button>
                    </div>
                </div>
            </div>

            {/* Recipe Modal */}
            {isModalOpen && recipe && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 bg-emerald-600 text-white flex justify-between items-start sticky top-0 z-10">
                            <div>
                                <h3 className="text-2xl font-bold">{recipe.title}</h3>
                                <div className="flex gap-2 mt-2">
                                    {recipe.benefits.map((b, i) => (
                                        <span key={i} className="text-xs bg-emerald-700 px-2 py-1 rounded-full font-medium border border-emerald-500">
                                            {b}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div 
                                className="prose prose-sm max-w-none text-slate-700"
                                dangerouslySetInnerHTML={{ __html: marked.parse(recipe.content) as string }}
                            ></div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                            >
                                Chiudi Ricetta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
