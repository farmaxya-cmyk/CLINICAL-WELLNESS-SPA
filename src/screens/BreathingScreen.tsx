
import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

const BreathingScreen = () => {
    const BREATHING_PATTERNS = {
      coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5, total: 10 },
      vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6, total: 10 },
      sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8, total: 19 },
      training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6, total: 12 },
    };

    const MUSIC_TRACKS = [
        { label: '🎵 Relax (432Hz Healing)', value: 'audio/432hz_healing.mp3' },
        { label: '🧠 Mind (Attivazione)', value: 'audio/Comunicativita.mp3' },
        { label: '🧘 Introspection (Profondità)', value: 'audio/Perdono.mp3' },
        { label: '🌈 7 Chakra (Armonizzazione)', value: 'audio/7-chackra.mp3' },
    ];

    const DURATION_OPTIONS = [
        { label: '5 Minuti', value: 300 },
        { label: '10 Minuti', value: 600 },
        { label: '15 Minuti', value: 900 },
        { label: '30 Minuti', value: 1800 },
    ];

    const [duration, setDuration] = React.useState(DURATION_OPTIONS[0].value);
    const [patternKey, setPatternKey] = React.useState('coherence');
    const [musicTrack, setMusicTrack] = React.useState(MUSIC_TRACKS[0].value);
    const [isActive, setIsActive] = React.useState(false);
    
    // Visual states
    const [instruction, setInstruction] = React.useState('Inizia');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(DURATION_OPTIONS[0].value);
    const [cycles, setCycles] = React.useState(0);
    
    const [mode, setMode] = React.useState<'open' | 'closed'>('open');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.8);
    
    // Refs for scheduling
    const audioRef = React.useRef<HTMLAudioElement>(null); 
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const masterGainRef = React.useRef<GainNode | null>(null);
    const scheduledNodesRef = React.useRef<AudioScheduledSourceNode[]>([]); // Track nodes to stop them
    const visualTimerRef = React.useRef<any>(null);
    const startTimeRef = React.useRef<number>(0);

    // Update Music Volume
    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicVolume;
        }
    }, [musicVolume]);

    // Handle Track Change
    React.useEffect(() => {
        if (audioRef.current) {
            const audioEl = audioRef.current;
            const currentSrc = audioEl.getAttribute('src');
            if (!currentSrc || !currentSrc.endsWith(musicTrack)) {
                audioEl.src = musicTrack;
                audioEl.load();
                audioEl.volume = musicVolume;
                
                if (isActive) {
                    audioEl.play().catch(e => console.error("Audio play failed:", e));
                }
            }
        }
    }, [musicTrack, isActive]);

    // --- AUDIO SCHEDULING ENGINE ---
    
    const createOscillatorNode = (time: number, freq: number, ctx: AudioContext, master: GainNode) => {
        const osc = ctx.createOscillator();
        const envelope = ctx.createGain();
        
        osc.connect(envelope);
        envelope.connect(master);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        // Envelope shaping
        envelope.gain.setValueAtTime(0, time);
        envelope.gain.linearRampToValueAtTime(dingVolume, time + 0.05);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
        
        osc.start(time);
        osc.stop(time + 1.2);
        
        return osc;
    };

    // FIX CRITICO: Schedulazione in batch.
    // Invece di usare setInterval, calcoliamo TUTTI i suoni per i prossimi X minuti
    // e li inviamo all'AudioContext in un colpo solo.
    // L'Hardware audio li eseguirà anche se il telefono dorme.
    const scheduleFullSession = () => {
        if (!audioCtxRef.current || !masterGainRef.current) return;
        const ctx = audioCtxRef.current;
        const master = masterGainRef.current;
        const pattern = BREATHING_PATTERNS[patternKey];
        
        const now = ctx.currentTime;
        // Piccolo ritardo per evitare glitch all'avvio
        let cursorTime = now + 0.5; 
        const endTime = now + duration;

        // Pulisci vecchi nodi se esistono
        stopAudioEngine();

        // Ciclo fino alla fine del tempo impostato
        while (cursorTime < endTime) {
            
            // 1. Suono Inspirazione (Alto)
            if (mode === 'closed') {
                const osc = createOscillatorNode(cursorTime, 800, ctx, master);
                scheduledNodesRef.current.push(osc);
            }
            cursorTime += pattern.inhale;

            // 2. Hold (Nessun suono, solo tempo)
            if (pattern.hold > 0) {
                cursorTime += pattern.hold;
            }

            // 3. Suono Espirazione (Basso)
            // Controllo per non suonare se abbiamo superato il tempo
            if (cursorTime < endTime && mode === 'closed') {
                const osc = createOscillatorNode(cursorTime, 400, ctx, master);
                scheduledNodesRef.current.push(osc);
            }
            cursorTime += pattern.exhale;
        }
    };

    const stopAudioEngine = () => {
        // Ferma tutti i nodi programmati
        scheduledNodesRef.current.forEach(node => {
            try { node.stop(); } catch(e) {}
        });
        scheduledNodesRef.current = [];
        
        // Reset Master Volume per sicurezza
        if (audioCtxRef.current && masterGainRef.current) {
            masterGainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
            masterGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        }
    };

    // Main Logic
    React.useEffect(() => {
        if (isActive) {
            // 1. Init Audio Context
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                const ctx = audioCtxRef.current;
                masterGainRef.current = ctx.createGain();
                masterGainRef.current.connect(ctx.destination);
            }
            
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            // 2. Reset Master Volume a 1
            if (masterGainRef.current) {
                masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
                masterGainRef.current.gain.setValueAtTime(1, ctx.currentTime);
            }

            // 3. Schedula TUTTO ORA
            scheduleFullSession();
            startTimeRef.current = Date.now();
            
            // 4. Gestione Visual (Separata dall'audio)
            const pattern = BREATHING_PATTERNS[patternKey];
            
            const runVisualCycle = () => {
                if (!isActive) return;
                
                setInstruction('Inspira');
                setScale(1);
                
                const inhaleTime = pattern.inhale * 1000;
                const holdTime = pattern.hold * 1000;
                const exhaleTime = pattern.exhale * 1000;
                
                // Usiamo timeout a catena per la grafica
                // Nota: La grafica si fermerà se lo schermo è spento, ma riprenderà
                // (magari desincronizzata) quando si accende. L'audio invece sarà PERFETTO.
                visualTimerRef.current = setTimeout(() => {
                    if (holdTime > 0) setInstruction('Trattieni');
                    
                    const nextStep = () => {
                        setInstruction('Espira');
                        setScale(0.6);
                        
                        visualTimerRef.current = setTimeout(() => {
                            setCycles(c => c + 1);
                            // Ricalibra se necessario, ma per ora loop semplice
                            if (isActive) runVisualCycle(); 
                        }, exhaleTime);
                    };

                    if (holdTime > 0) {
                        visualTimerRef.current = setTimeout(nextStep, holdTime);
                    } else {
                        nextStep();
                    }
                }, inhaleTime);
            };
            
            runVisualCycle();

            // 5. Countdown timer (UI only)
            // Usiamo Date.now() per calcolare il delta reale anche se il telefono dorme
            const endTimestamp = Date.now() + (duration * 1000);
            
            const countdownInterval = setInterval(() => {
                const now = Date.now();
                const remaining = Math.ceil((endTimestamp - now) / 1000);
                
                if (remaining <= 0) {
                    setTimeLeft(0);
                    handleStop();
                    clearInterval(countdownInterval);
                } else {
                    setTimeLeft(remaining);
                }
            }, 1000);

            return () => {
                clearTimeout(visualTimerRef.current);
                clearInterval(countdownInterval);
                stopAudioEngine(); // Cleanup fondamentale se componente smonta
            };
        }
    }, [isActive]); // Re-run solo se isActive cambia

    const handleStop = () => {
        setIsActive(false);
        stopAudioEngine();
        
        // Audio Music Stop
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        setInstruction('Inizia');
        setScale(0.6);
        setCycles(0);
        setTimeLeft(duration);
    };

    const handleStart = () => {
        setIsActive(true);
        if (audioRef.current) {
            audioRef.current.volume = musicVolume;
            audioRef.current.play().catch(e => alert("Tocca lo schermo per abilitare l'audio"));
        }
    };

    const circleTransitionDuration = isActive
        ? (instruction === 'Inspira' ? BREATHING_PATTERNS[patternKey].inhale : BREATHING_PATTERNS[patternKey].exhale)
        : 1;

    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-full">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <LungIcon className="w-8 h-8 text-sky-600" />
                    <h1 className="text-3xl font-bold text-slate-800">Meditazione Guidata</h1>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8 space-y-4">
                    
                    {/* Mode Selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2 pl-2">
                            👁️ Modalità
                        </label>
                        <div className="flex bg-white rounded-md p-1 border border-slate-200 shadow-sm w-full sm:w-auto">
                            <button
                                onClick={() => setMode('open')}
                                disabled={isActive}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'open' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <EyeIcon className="w-4 h-4" />
                                Visiva
                            </button>
                            <button
                                onClick={() => setMode('closed')}
                                disabled={isActive}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'closed' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <EyeOffIcon className="w-4 h-4" />
                                Guidata
                            </button>
                        </div>
                    </div>
                    {mode === 'open' && <p className="text-xs text-slate-400 text-center italic">In modalità Visiva i segnali acustici ("Ding") sono disattivati.</p>}

                    {/* Duration */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label htmlFor="duration-select" className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                            ⏱️ Durata
                        </label>
                        <select 
                            id="duration-select"
                            value={duration} 
                            onChange={e => {
                                setDuration(Number(e.target.value));
                                setTimeLeft(Number(e.target.value));
                            }}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 disabled:opacity-50 text-sm font-medium text-slate-700"
                        >
                            {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {/* Pattern */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label htmlFor="pattern-select" className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                            <LungIcon className="w-4 h-4 text-slate-500" /> Ritmo
                        </label>
                        <select 
                            id="pattern-select"
                            value={patternKey}
                            onChange={e => setPatternKey(e.target.value)}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 disabled:opacity-50 text-sm font-medium text-slate-700"
                        >
                            {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => <option key={key} value={key}>{pat.name}</option>)}
                        </select>
                    </div>

                    {/* Music Selection */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-sky-50 rounded-lg border border-sky-100">
                        <label htmlFor="music-select" className="text-sm font-bold text-sky-700 uppercase flex items-center gap-2">
                            🎵 Frequenza
                        </label>
                        <select 
                            id="music-select"
                            value={musicTrack}
                            onChange={e => setMusicTrack(e.target.value)}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-white border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 disabled:opacity-50 text-sm font-medium text-slate-700 shadow-sm"
                        >
                            {MUSIC_TRACKS.map(track => <option key={track.value} value={track.value}>{track.label}</option>)}
                        </select>
                    </div>

                    {/* Volume Controls */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="music-vol" className="text-xs font-bold text-slate-600 uppercase w-20">Musica</label>
                            <input 
                                id="music-vol" 
                                type="range" 
                                min="0" max="1" step="0.01" 
                                value={musicVolume} 
                                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor="ding-vol" className="text-xs font-bold text-slate-600 uppercase w-20">Segnale</label>
                            <input 
                                id="ding-vol" 
                                type="range" 
                                min="0" max="1" step="0.01" 
                                value={dingVolume} 
                                onChange={(e) => setDingVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Visualization - PURE CSS CIRCLES - NO IMAGE */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mx-auto my-8">
                    <div className={`absolute w-full h-full bg-sky-200 rounded-full opacity-50 ${isActive ? 'animate-pulse' : ''}`}></div>
                    <div 
                        className="absolute w-full h-full bg-sky-400 rounded-full shadow-2xl flex items-center justify-center transition-all ease-in-out"
                        style={{ 
                            transform: `scale(${scale})`,
                            transitionDuration: `${circleTransitionDuration}s`
                        }}
                    >
                        <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-br from-sky-300 to-blue-500 opacity-80"></div>
                    </div>
                    <span className="relative text-3xl md:text-4xl font-extrabold text-white z-10 uppercase tracking-widest drop-shadow-md text-shadow-sm">
                        {instruction}
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cicli</p>
                        <p className="text-3xl font-bold text-slate-700">{cycles}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                         <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tempo</p>
                         <p className="text-3xl font-bold text-slate-700 font-mono">
                            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                         </p>
                    </div>
                </div>

                <button
                    onClick={isActive ? handleStop : handleStart}
                    className={`w-full mt-8 block px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${isActive ? 'bg-slate-700 hover:bg-slate-800' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'}`}
                >
                    {isActive ? (
                        <>⏸️ Ferma Sessione</>
                    ) : (
                        <>▶️ Inizia Meditazione</>
                    )}
                </button>
            </div>
            
            {/* Background Music Player */}
            <audio 
                ref={audioRef} 
                loop
                preload="auto"
                onError={(e) => console.error("Errore background music", e)}
            />
        </div>
    );
};

export default BreathingScreen;
