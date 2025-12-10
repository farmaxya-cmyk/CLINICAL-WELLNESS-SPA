
import React from 'react';
import { assessmentsData } from '../data/assessmentsData';
import { LineChart } from '../components/LineChart';
import { getStoredJSON } from '../utils/storage';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { LockIcon } from '../components/icons/LockIcon';

const AssessmentScreen = ({ user, onNavigate, onStartAssessment }) => {
    const [historyData, setHistoryData] = React.useState({});
    const COOLDOWN_DAYS = 15;

    React.useEffect(() => {
        if (user) {
            const data = {};
            Object.keys(assessmentsData).forEach(key => {
                const history = getStoredJSON(`assessmentHistory_${user.email}_${key}`, []);
                if (history.length > 0) {
                    data[key] = history;
                }
            });
            setHistoryData(data);
        }
    }, [user]);

    const hasHistory = Object.keys(historyData).length > 0;

    const getAssessmentStatus = (assessmentId) => {
        const history = historyData[assessmentId];
        if (!history || history.length === 0) return { status: 'new', daysRemaining: 0 };

        const lastDate = new Date(history[history.length - 1].date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < COOLDOWN_DAYS) {
            return { status: 'locked', daysRemaining: COOLDOWN_DAYS - diffDays };
        }
        return { status: 'ready', daysRemaining: 0 };
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in pb-32">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Test di Autovalutazione</h1>
            <p className="text-xl text-slate-600 mb-8">Misura il tuo benessere. Ripeti i test ogni 15 giorni per monitorare i progressi.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(assessmentsData).map(assessment => {
                    const { status, daysRemaining } = getAssessmentStatus(assessment.id);
                    const isLocked = status === 'locked';

                    return (
                        <div
                            key={assessment.id}
                            className={`rounded-xl shadow-md p-6 flex flex-col items-start transition-all duration-300 relative overflow-hidden ${
                                isLocked 
                                ? 'bg-slate-50 border border-slate-200' 
                                : 'bg-white hover:shadow-xl hover:scale-105 cursor-pointer'
                            }`}
                            onClick={() => !isLocked && onStartAssessment(assessment.id)}
                        >
                            {/* Header Card */}
                            <div className="flex justify-between w-full mb-4">
                                <div className={`p-3 rounded-full ${isLocked ? 'bg-slate-200' : 'bg-sky-100'}`}>
                                    <assessment.Icon className={`w-8 h-8 ${isLocked ? 'text-slate-500' : 'text-sky-600'}`} />
                                </div>
                                {isLocked && (
                                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg h-fit">
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span className="text-xs font-bold">Completato</span>
                                    </div>
                                )}
                            </div>

                            <h2 className={`text-xl font-bold ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                                {assessment.title}
                            </h2>
                            
                            <p className="text-slate-500 mt-2 text-sm">
                                {isLocked 
                                    ? "Test completato di recente. Attendi per vedere reali miglioramenti." 
                                    : "Valuta la tua situazione attuale in quest'area."}
                            </p>

                            {/* Locked State Overlay Content */}
                            {isLocked && (
                                <div className="mt-4 w-full pt-4 border-t border-slate-200">
                                    <div className="flex items-center gap-2 text-slate-500 mb-3">
                                        <LockIcon className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Disponibile tra {daysRemaining} {daysRemaining === 1 ? 'giorno' : 'giorni'}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm("Rifare il test prima dei 15 giorni potrebbe non mostrare cambiamenti significativi. Vuoi procedere comunque?")) {
                                                onStartAssessment(assessment.id);
                                            }
                                        }}
                                        className="text-xs text-sky-600 hover:text-sky-800 underline font-medium"
                                    >
                                        Vuoi ripeterlo subito?
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {hasHistory && (
                <div className="mt-16 pt-8 border-t border-slate-200 animate-fade-in">
                    <h2 className="text-3xl font-bold text-slate-800 mb-6">I tuoi progressi nel tempo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.keys(historyData).map(key => {
                            const assessment = assessmentsData[key];
                            const data = historyData[key];
                            const latestScore = data.length > 0 ? data[data.length - 1].score : 0;
                            
                            return (
                                <div key={key} className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-sky-50 rounded-lg">
                                                <assessment.Icon className="w-6 h-6 text-sky-600" />
                                            </div>
                                            <h3 className="font-bold text-slate-700">{assessment.title}</h3>
                                        </div>
                                        <span className="text-2xl font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md min-w-[3rem] text-center">{latestScore}</span>
                                    </div>
                                    <div className="w-full h-48">
                                        <LineChart data={data} width={400} height={200} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentScreen;
