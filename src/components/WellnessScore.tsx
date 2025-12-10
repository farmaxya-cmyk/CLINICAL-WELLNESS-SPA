import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { assessmentsData } from '../data/assessmentsData';
import { getStoredJSON } from '../utils/storage';

const WellnessScore = ({ user, onNavigate }) => {
    const [lowestScore, setLowestScore] = React.useState(null);

    React.useEffect(() => {
        let scores = [];
        for (const assessmentId of Object.keys(assessmentsData)) {
            // FIX: Use getStoredJSON for robust parsing from localStorage.
            const storedHistory = getStoredJSON(`assessmentHistory_${user.email}_${assessmentId}`, []);
            if (storedHistory.length > 0) {
                const latestScore = storedHistory[storedHistory.length - 1];
                scores.push({
                    id: assessmentId,
                    title: assessmentsData[assessmentId].title.replace('Analisi ', ''),
                    score: latestScore.score,
                    Icon: assessmentsData[assessmentId].Icon
                });
            }
        }

        if (scores.length > 0) {
            scores.sort((a, b) => a.score - b.score);
            setLowestScore(scores[0]);
        }
    }, [user.email]);

    if (!lowestScore) {
        return (
            <div className="bg-sky-600 text-white rounded-xl shadow-lg p-6 mb-8 animate-fade-in">
                <div className="flex items-center gap-4">
                    <SparklesIcon className="w-10 h-10 text-sky-300 flex-shrink-0" />
                    <div>
                        <h2 className="text-xl font-bold">Inizia il tuo percorso di benessere!</h2>
                        <p className="text-sky-200">Completa il tuo primo test di autovalutazione per scoprire i tuoi punti di forza.</p>
                    </div>
                </div>
                <button 
                    onClick={() => onNavigate('assessments')}
                    className="mt-4 w-full bg-white text-sky-700 font-bold py-2 px-4 rounded-lg hover:bg-sky-100 transition-colors"
                >
                    Inizia il primo test
                </button>
            </div>
        );
    }

    const { Icon, title, score, id } = lowestScore;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-fade-in border border-slate-200">
             <h3 className="text-sm font-semibold text-slate-500 mb-2">Focus Benessere</h3>
             <div className="flex items-start gap-4">
                 <div className="p-3 bg-red-100 rounded-full">
                     <TrendingDownIcon className="w-6 h-6 text-red-600" />
                 </div>
                 <div className="flex-grow">
                     <h2 className="text-xl font-bold text-slate-800">Area da Migliorare: {title}</h2>
                     <p className="text-slate-600">Il tuo ultimo punteggio è <span className="font-bold text-red-600">{score}</span>. Concentrati su quest'area per migliorare il tuo benessere generale.</p>
                     <button
                         onClick={() => onNavigate('assessments')}
                         className="mt-3 text-sky-600 font-semibold hover:text-sky-800 transition-colors text-sm"
                     >
                         Vai ai test di valutazione →
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default WellnessScore;
