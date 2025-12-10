import React from 'react';
import { LockIcon } from '../components/icons/LockIcon';
import { BellIcon } from '../components/icons/BellIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { WellnessProgram, WellnessProgramsData, Mission } from '../src/types';
import { getStoredJSON } from '../utils/storage';


export const WellnessRoutineScreen = ({ user, showNotification, wellnessData }: { user: any, showNotification: (message: string, type: 'success' | 'error') => void, wellnessData: WellnessProgramsData }) => {
    const [missionStates, setMissionStates] = React.useState({});
    const [manualUnlocks, setManualUnlocks] = React.useState([]);
    const [activeReminders, setActiveReminders] = React.useState(new Set());
    const [openProgram, setOpenProgram] = React.useState<string | null>(null);

    const storageKeys = React.useMemo(() => ({
        missionStates: `missionStates_${user.email}`,
        manualUnlocks: `manualUnlocks_${user.email}`,
        reminders: `activeReminders_${user.email}`,
    }), [user.email]);
    
    React.useEffect(() => {
        const savedMissionStates = getStoredJSON(storageKeys.missionStates, {});
        const savedUnlocks = getStoredJSON(storageKeys.manualUnlocks, []);
        const savedReminders = getStoredJSON(storageKeys.reminders, []);

        setMissionStates(savedMissionStates);
        setManualUnlocks(savedUnlocks);
        setActiveReminders(new Set(savedReminders));
    }, [storageKeys]);
    
    const pointsData = React.useMemo(() => {
        let total = 0;
        const byProgram: { [key: string]: { name: string; points: number; dependsOn?: string; unlocksAt?: number; } } = {};
        for (const program of Object.values(wellnessData) as WellnessProgram[]) {
            let programPoints = 0;
            const allMissions = [...(program.daily || []), ...(program.weekly || [])];
            for (const mission of allMissions) {
                if (missionStates[mission.id]?.completed) {
                    programPoints += mission.points;
                }
            }
            if(program.id){
                byProgram[program.id] = { name: program.name, points: programPoints, dependsOn: program.dependsOn, unlocksAt: program.unlocksAt };
                total += programPoints;
            }
        }
        return { total, byProgram };
    }, [missionStates, wellnessData]);

    const handleToggleMission = (missionId, missionPoints) => {
        setMissionStates(prev => {
            const newStates = { ...prev };
            const wasCompleted = newStates[missionId]?.completed || false;
            newStates[missionId] = { ...newStates[missionId], completed: !wasCompleted };
            localStorage.setItem(storageKeys.missionStates, JSON.stringify(newStates));
            const message = wasCompleted ? `Missione annullata.` : `Missione completata! +${missionPoints} punti!`;
            showNotification(message, 'success');
            return newStates;
        });
    };

    // Funzione per generare e scaricare il file .ics
    const downloadCalendarFile = (mission: Mission) => {
        const now = new Date();
        let hour = 8; // Default 8:00 AM
        let minute = 0;

        if (mission.reminderConfig?.time) {
            const parts = mission.reminderConfig.time.split(':');
            if (parts.length === 2) {
                hour = parseInt(parts[0], 10);
                minute = parseInt(parts[1], 10);
            }
        } else if (mission.reminderConfig?.startHour) {
            hour = mission.reminderConfig.startHour;
        }

        // Set start date to tomorrow at the specified time
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(hour, minute, 0, 0);

        // Format date for ICS (YYYYMMDDTHHMMSS)
        const formatDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const summary = `Wellness: ${mission.title}`;
        const description = `Promemoria benessere: ${mission.description}`;
        
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ClinicalWellnessSpa//Benessere//IT
BEGIN:VEVENT
UID:${new Date().getTime()}@clinicalwellness.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
RRULE:FREQ=DAILY
SUMMARY:${summary}
DESCRIPTION:${description}
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${mission.title.replace(/\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const onToggleReminder = (mission: Mission) => {
        // Chiedi conferma all'utente
        const shouldAddToCalendar = window.confirm(`Vuoi aggiungere questo promemoria ("${mission.title}") al tuo Calendario (Google/Apple)?`);

        if (shouldAddToCalendar) {
            downloadCalendarFile(mission);
            showNotification('Evento calendario scaricato. Aprilo per salvarlo.', 'success');
        }

        // Aggiorna comunque lo stato visivo (campanella colorata)
        setActiveReminders(prev => {
            const newReminders = new Set(prev);
            if (newReminders.has(mission.id)) {
                newReminders.delete(mission.id);
            } else {
                newReminders.add(mission.id);
            }
            localStorage.setItem(storageKeys.reminders, JSON.stringify(Array.from(newReminders)));
            return newReminders;
        });
    };
    
    const programGroups = React.useMemo(() => {
        const groups: { [key: string]: { title: string; programs: WellnessProgram[] } } = {
            start: { title: '🌟 Routine Base del Benessere', programs: [] },
            food: { title: '🍎 Alimentazione', programs: [] },
            sleep: { title: '🌙 Sonno', programs: [] },
            anxiety_stress: { title: '🧘 Ansia & Stress', programs: [] },
            activity: { title: '🏃 Movimento', programs: [] },
            smart: { title: '🚀 Programmi Smart', programs: [] }
        };

        (Object.values(wellnessData) as WellnessProgram[]).forEach(p => {
            if (p.id === 'start') groups.start.programs.push(p);
            else if (p.id.startsWith('food')) groups.food.programs.push(p);
            else if (p.id.startsWith('sleep')) groups.sleep.programs.push(p);
            else if (p.id.startsWith('anxiety_stress')) groups.anxiety_stress.programs.push(p);
            else if (p.id.startsWith('activity')) groups.activity.programs.push(p);
            else if (p.isSmart) groups.smart.programs.push(p);
        });

        // Sort levels within each group
        for (const key in groups) {
            groups[key].programs.sort((a, b) => {
                const aLevel = parseInt(a.id.match(/\d+$/)?.[0] || '1');
                const bLevel = parseInt(b.id.match(/\d+$/)?.[0] || '1');
                if (a.id.includes('gold')) return -1; 
                if (b.id.includes('gold')) return 1;
                return aLevel - bLevel;
            });
        }

        return groups;
    }, [wellnessData]);

    const ProgramCard: React.FC<{ program: WellnessProgram }> = ({ program }) => {
        const programPoints = pointsData.byProgram[program.id]?.points || 0;
        
        const isManuallyUnlocked = manualUnlocks.includes(program.id);
        let isLocked = false;
        let pointsRemaining = 0;
        const dependency = program.dependsOn ? pointsData.byProgram[program.dependsOn] : null;

        if (dependency && typeof program.unlocksAt === 'number' && !isManuallyUnlocked) {
            const dependencyPoints = dependency.points || 0;
            if (dependencyPoints < program.unlocksAt) {
                isLocked = true;
                pointsRemaining = program.unlocksAt - dependencyPoints;
            }
        }

        const isExpanded = openProgram === program.id;

        if (isLocked && dependency) {
            return (
                <div className="bg-white rounded-xl shadow-lg p-4 opacity-60">
                    <div className="flex items-center justify-center gap-4 text-center">
                        <LockIcon className="w-8 h-8 text-slate-400" />
                        <div>
                            <h3 className="text-lg font-bold text-slate-600">{program.name}</h3>
                            <p className="text-sm text-slate-500">
                                Richiede {program.unlocksAt} punti in "{dependency.name}". Mancano {pointsRemaining} punti.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="bg-white rounded-xl shadow-lg">
                <button 
                    className="w-full text-left p-4 flex justify-between items-center"
                    onClick={() => setOpenProgram(isExpanded ? null : program.id)}
                    aria-expanded={isExpanded}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{program.Icon}</span>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{program.name}</h3>
                            <p className="text-slate-500">{program.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="font-bold text-sky-600 text-lg">{programPoints} Punti</span>
                       <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </button>
                {isExpanded && (
                    <div className="p-4 border-t border-slate-200 animate-fade-in">
                        <p className="text-slate-600 mb-4">{program.description}</p>
                        {program.daily && program.daily.length > 0 && <h4 className="font-bold text-slate-700 mb-2 mt-4">Missioni Giornaliere</h4>}
                        <ul className="space-y-3">
                            {program.daily?.map(mission => (
                                <li key={mission.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{mission.Icon}</span>
                                        <div>
                                            <p className="font-semibold text-slate-700">{mission.title}</p>
                                            <p className="text-sm text-slate-500">{mission.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {mission.remindable && (
                                            <button 
                                                onClick={() => onToggleReminder(mission)}
                                                className={`p-2 rounded-full transition-colors ${activeReminders.has(mission.id) ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:bg-slate-200'}`}
                                                aria-label={activeReminders.has(mission.id) ? 'Disattiva promemoria' : 'Attiva promemoria'}
                                                title="Aggiungi al calendario"
                                            >
                                                <BellIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleToggleMission(mission.id, mission.points)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full transition-colors bg-white border-2"
                                            style={{ 
                                                borderColor: missionStates[mission.id]?.completed ? '#22c55e' : '#e2e8f0',
                                                color: missionStates[mission.id]?.completed ? '#166534' : '#334155'
                                            }}
                                        >
                                            {missionStates[mission.id]?.completed && <CheckCircleIcon className="w-5 h-5 text-green-600"/>}
                                            <span>{mission.points} Punti</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {program.weekly && program.weekly.length > 0 && <h4 className="font-bold text-slate-700 mb-2 mt-4">Missioni Settimanali</h4>}
                         <ul className="space-y-3">
                            {program.weekly?.map(mission => (
                                <li key={mission.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{mission.Icon}</span>
                                        <div>
                                            <p className="font-semibold text-slate-700">{mission.title}</p>
                                            <p className="text-sm text-slate-500">{mission.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleToggleMission(mission.id, mission.points)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold rounded-full transition-colors bg-white border-2"
                                            style={{ 
                                                borderColor: missionStates[mission.id]?.completed ? '#22c55e' : '#e2e8f0',
                                                color: missionStates[mission.id]?.completed ? '#166534' : '#334155'
                                            }}
                                        >
                                            {missionStates[mission.id]?.completed && <CheckCircleIcon className="w-5 h-5 text-green-600"/>}
                                            <span>{mission.points} Punti</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };
    
    const groupOrder = ['start', 'food', 'sleep', 'anxiety_stress', 'activity', 'smart'];

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">La Tua Routine di Benessere</h1>
            <p className="text-xl text-slate-600 mb-8">Completa le missioni, accumula punti e sblocca nuovi livelli!</p>

            <div className="bg-sky-600 text-white p-6 rounded-2xl shadow-lg mb-8 text-center">
                <p className="text-lg text-sky-200">Punti Benessere Totali</p>
                <p className="text-5xl font-bold">{pointsData.total}</p>
            </div>
            
            {groupOrder.map(key => {
                const group = programGroups[key];
                if (!group || group.programs.length === 0) return null;
                return (
                    <div key={key} className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">{group.title}</h2>
                        <div className="space-y-4">
                             {group.programs.map(p => (
                                 <ProgramCard key={p.id} program={p} />
                             ))}
                        </div>
                    </div>
                );
            })}

        </div>
    );
};