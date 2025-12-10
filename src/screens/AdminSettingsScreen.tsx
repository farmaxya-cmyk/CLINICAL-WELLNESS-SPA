
import React from 'react';
import { getStoredJSON } from '../utils/storage';
import { wellnessProgramsData as defaultWellnessData } from '../data/wellnessProgramsData';
import { WellnessProgram, WellnessProgramsData } from '../src/types';
import { LockIcon } from '../components/icons/LockIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';

const AdminSettingsScreen = ({ onSettingsSaved, showNotification }) => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [editableData, setEditableData] = React.useState<WellnessProgramsData | null>(null);
    const [openProgramId, setOpenProgramId] = React.useState<string | null>(null);
    const ADMIN_PASSWORD = 'CWSPA';

    React.useEffect(() => {
        const data = getStoredJSON('customWellnessProgramsData', defaultWellnessData);
        try {
            setEditableData(structuredClone(data));
        } catch (e) {
            console.error("Deep copy failed, falling back to default", e);
            setEditableData(structuredClone(defaultWellnessData));
        }
    }, []);

    const handleAuth = () => {
        if (password.trim() === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            showNotification('Password errata', 'error');
            setPassword('');
        }
    };

    const handlePointsChange = (programId: string, missionType: 'daily' | 'weekly', missionIndex: number, newPoints: number) => {
        if (!editableData) return;
        
        try {
            const newData = structuredClone(editableData); 
            // @ts-ignore
            newData[programId][missionType][missionIndex].points = newPoints;
            setEditableData(newData);
        } catch (e) {
            console.error("Error updating points", e);
        }
    };

    const handleThresholdChange = (programId: string, newThreshold: number) => {
        if (!editableData) return;
        
        try {
            const newData = structuredClone(editableData);
            newData[programId].unlocksAt = newThreshold;
            setEditableData(newData);
        } catch (e) {
            console.error("Error updating threshold", e);
        }
    };


    const handleSaveChanges = () => {
        if (!editableData) return;
        try {
            localStorage.setItem('customWellnessProgramsData', JSON.stringify(editableData));
            showNotification('Impostazioni salvate con successo!', 'success');
            onSettingsSaved();
        } catch (e) {
            console.error("Save failed", e);
            showNotification('Errore nel salvataggio delle impostazioni.', 'error');
        }
    };

    const handleResetToDefaults = () => {
        if (window.confirm('Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti? Le modifiche andranno perse.')) {
            try {
                const defaultDataCopy = structuredClone(defaultWellnessData);
                setEditableData(defaultDataCopy);
                localStorage.setItem('customWellnessProgramsData', JSON.stringify(defaultDataCopy));
                showNotification('Impostazioni ripristinate ai valori predefiniti.', 'success');
                onSettingsSaved();
            } catch (e) {
                console.error("Reset failed", e);
                showNotification('Errore nel ripristino delle impostazioni.', 'error');
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100">
                <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl">
                    <div className="text-center mb-6">
                        <LockIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-slate-800">Area Riservata</h1>
                        <p className="text-slate-500">Inserisci la password per continuare</p>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500"
                            placeholder="Password"
                        />
                        <button
                            onClick={handleAuth}
                            className="w-full px-4 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors"
                        >
                            Accedi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!editableData) return null; // or a loader

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">Impostazioni Punteggi e Soglie</h1>
                    <p className="text-xl text-slate-600">Modifica i punti per ogni missione e le soglie per sbloccare i livelli.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleResetToDefaults} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Ripristina</button>
                    <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md">Salva Modifiche</button>
                </div>
            </div>

            <div className="space-y-4">
                {Object.values(editableData).map((program: WellnessProgram) => (
                    <div key={program.id} className="bg-white rounded-xl shadow-lg">
                        <button
                            className="w-full text-left p-4 flex justify-between items-center"
                            onClick={() => setOpenProgramId(openProgramId === program.id ? null : program.id)}
                        >
                             <div className="flex items-center gap-3">
                                <span className="text-3xl">{program.Icon}</span>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{program.name}</h3>
                                    <p className="text-slate-500">{program.subtitle}</p>
                                </div>
                            </div>
                            <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform ${openProgramId === program.id ? 'rotate-180' : ''}`} />
                        </button>

                        {openProgramId === program.id && (
                            <div className="p-4 border-t border-slate-200">
                                {typeof program.unlocksAt === 'number' && (
                                    <div className="mb-6 bg-sky-50 p-4 rounded-lg">
                                        <h4 className="font-bold text-slate-800 mb-2">Impostazioni Livello</h4>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor={`threshold-${program.id}`} className="font-semibold text-slate-700">Punti necessari per sbloccare:</label>
                                            <input
                                                id={`threshold-${program.id}`}
                                                type="number"
                                                value={program.unlocksAt}
                                                onChange={(e) => handleThresholdChange(program.id, parseInt(e.target.value, 10) || 0)}
                                                className="w-24 p-1 text-center border border-slate-300 rounded-md"
                                            />
                                        </div>
                                    </div>
                                )}

                                {program.daily && program.daily.length > 0 && <h4 className="font-bold text-slate-700 mb-2 mt-2">Missioni Giornaliere</h4>}
                                <div className="space-y-2">
                                    {program.daily?.map((mission, index) => (
                                        <div key={mission.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                            <p className="text-slate-700">{mission.Icon} {mission.title}</p>
                                            <input 
                                                type="number" 
                                                value={mission.points}
                                                onChange={(e) => handlePointsChange(program.id, 'daily', index, parseInt(e.target.value, 10) || 0)}
                                                className="w-20 p-1 text-center border border-slate-300 rounded-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {program.weekly && program.weekly.length > 0 && <h4 className="font-bold text-slate-700 mb-2 mt-4">Missioni Settimanali</h4>}
                                 <div className="space-y-2">
                                    {program.weekly?.map((mission, index) => (
                                        <div key={mission.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                            <p className="text-slate-700">{mission.Icon} {mission.title}</p>
                                            <input 
                                                type="number" 
                                                value={mission.points}
                                                onChange={(e) => handlePointsChange(program.id, 'weekly', index, parseInt(e.target.value, 10) || 0)}
                                                className="w-20 p-1 text-center border border-slate-300 rounded-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSettingsScreen;
