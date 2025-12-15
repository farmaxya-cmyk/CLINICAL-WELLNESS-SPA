
import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

// Un WAV silenzioso cortissimo e standard, massimizza la compatibilità iOS per tenere la sessione attiva
const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

const BreathingScreen = () => {
    // --- CONFIGURAZIONE ---
    const BREATHING_PATTERNS = {
      coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5 },
      vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6 },
      sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8 },
      training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6 },
    };

    const MUSIC_TRACKS = [
        { label: '🔕 Silenzio (Solo Ding)', value: SILENT_WAV },
        { label: '🎵 Relax (Healing)', value: 'https://files.catbox.moe/zc81yy.mp3' },
        { label: '🧘 7 Chakra', value: 'https://files.catbox.moe/j5j66e.mp3' },
        { label: '🧠 Mind', value: 'https://files.catbox.moe/ad01.mp3' },
        { label: '🔮 Introspezione', value: 'https://files.catbox.moe/w2234a.mp3' },
    ];

    const DURATION_OPTIONS = [
        { label: '1 Minuto', value: 60 },
        { label: '5 Minuti', value: 300 },
        { label: '10 Minuti', value: 600 },
        { label: '20 Minuti', value: 1200 },
    ];

    // --- STATO ---
    const [duration, setDuration] = React.useState(DURATION_OPTIONS[1].value);
    const [patternKey, setPatternKey] = React.useState('coherence');
    const [musicTrack, setMusicTrack] = React.useState(MUSIC_TRACKS[1].value);
    const [isActive, setIsActive] = React.useState(false);
    
    // UI Visuale
    const [instruction, setInstruction] = React.useState('Pronto');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(duration);
    const [cycles, setCycles] = React.useState(0);
    
    // Settings
    const [mode, setMode] = React.useState<'open' | 'closed'>('closed');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.8);

    // --- REFS ---
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const masterGainRef = React.useRef<GainNode | null>(null);
    const bgAudioRef = React.useRef<HTMLAudioElement>(null);
    const wakeLockRef = React.useRef<any>(null);
    const scheduledNodesRef = React.useRef<AudioScheduledSourceNode[]>([]);
    const visualTimerRef = React.useRef<any>(null);
    const countdownTimerRef = React.useRef<any>(null);

    // --- WAKE LOCK ---
    const toggleWakeLock = async (active: boolean) => {
        if (!('wakeLock' in navigator)) return;
        try {
            if (active) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            } else if (wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        } catch (err) {
            console.warn('Wake Lock error (non critico):', err);
        }
    };

    // --- AUDIO ENGINE ---
    const scheduleDing = (ctx: AudioContext, destination: AudioNode, time: number, pitch: number) => {
        try {
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            const gain2 = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = pitch;
            osc2.type = 'triangle';
            osc2.frequency.value = pitch * 2.5; 

            osc.connect(gain);
            osc2.connect(gain2);
            gain.connect(destination);
            gain2.connect(destination);

            const attack = 0.05;
            const decay = 2.5;

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(1, time + attack);
            gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

            gain2.gain.setValueAtTime(0, time);
            gain2.gain.linearRampToValueAtTime(0.1, time + attack);
            gain2.gain.exponentialRampToValueAtTime(0.001, time + decay);

            osc.start(time);
            osc.stop(time + decay + 1);
            osc2.start(time);
            osc2.stop(time + decay + 1);

            scheduledNodesRef.current.push(osc);
            scheduledNodesRef.current.push(osc2);
        } catch (e) {
            console.warn("Errore creazione ding:", e);
        }
    };

    const scheduleEntireSession = (ctx: AudioContext) => {
        const now = ctx.currentTime;
        let cursor = now + 0.1; 
        const endTime = now + duration;
        const pattern = BREATHING_PATTERNS[patternKey];

        scheduledNodesRef.current = [];

        while (cursor < endTime) {
            scheduleDing(ctx, masterGainRef.current!, cursor, 432); // Inspira
            cursor += pattern.inhale;
            if (pattern.hold > 0) cursor += pattern.hold;
            if (cursor < endTime) {
                scheduleDing(ctx, masterGainRef.current!, cursor, 216); // Espira
            }
            cursor += pattern.exhale;
        }
    };

    // --- VISUAL ENGINE ---
    const startVisuals = () => {
        const pattern = BREATHING_PATTERNS[patternKey];
        
        const loop = () => {
            if (!isActive) return; // Safety check
            
            setInstruction('Inspira');
            setScale(1);
            
            visualTimerRef.current = setTimeout(() => {
                if (pattern.hold > 0) {
                    setInstruction('Trattieni');
                    visualTimerRef.current = setTimeout(() => {
                        setInstruction('Espira');
                        setScale(0.6);
                        visualTimerRef.current = setTimeout(() => {
                            setCycles(c => c + 1);
                            loop();
                        }, pattern.exhale * 1000);
                    }, pattern.hold * 1000);
                } else {
                    setInstruction('Espira');
                    setScale(0.6);
                    visualTimerRef.current = setTimeout(() => {
                        setCycles(c => c + 1);
                        loop();
                    }, pattern.exhale * 1000);
                }
            }, pattern.inhale * 1000);
        };
        loop();
    };

    // --- MAIN HANDLERS ---
    const handleStart = async () => {
        // 1. UPDATE UI IMMEDIATAMENTE
        // Questo garantisce che l'utente veda subito che l'app ha risposto
        setIsActive(true);
        setCycles(0);
        setTimeLeft(duration);
        toggleWakeLock(true);
        
        // Avvia loop visuale
        // Piccolo timeout per permettere al render di aggiornarsi prima di far partire il loop
        setTimeout(() => startVisuals(), 50);

        // Avvia timer countdown
        const endTimeMs = Date.now() + (duration * 1000);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = setInterval(() => {
            const remaining = Math.ceil((endTimeMs - Date.now()) / 1000);
            if (remaining <= 0) {
                handleStop();
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        // 2. AUDIO INIT (in un blocco try-catch separato per non rompere la UI)
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
                const masterGain = audioCtxRef.current.createGain();
                masterGain.gain.value = dingVolume;
                masterGain.connect(audioCtxRef.current.destination);
                masterGainRef.current = masterGain;
            }

            // Resume è necessario sui browser moderni
            if (audioCtxRef.current?.state === 'suspended') {
                await audioCtxRef.current.resume();
            }
        } catch (err) {
            console.error("Errore inizializzazione AudioContext:", err);
            // Non blocchiamo, continuiamo
        }

        // 3. BACKGROUND MUSIC (altro blocco try-catch)
        try {
            if (bgAudioRef.current) {
                bgAudioRef.current.src = musicTrack;
                bgAudioRef.current.volume = musicVolume;
                // Play deve essere atteso, ma se fallisce (es. formato non supportato) non deve fermare tutto
                await bgAudioRef.current.play();
            }
        } catch (err) {
            console.error("Errore riproduzione musica:", err);
        }

        // 4. SCHEDULING DING (altro blocco try-catch)
        try {
            if (mode === 'closed' && audioCtxRef.current) {
                scheduleEntireSession(audioCtxRef.current);
            }
        } catch (err) {
            console.error("Errore scheduling suoni:", err);
        }
    };

    const handleStop = () => {
        setIsActive(false);
        toggleWakeLock(false);

        // Stop nodi audio
        scheduledNodesRef.current.forEach(node => {
            try { node.stop(); node.disconnect(); } catch (e) {}
        });
        scheduledNodesRef.current = [];

        // Stop musica
        if (bgAudioRef.current) {
            bgAudioRef.current.pause();
            bgAudioRef.current.currentTime = 0;
        }

        // Stop timers
        clearTimeout(visualTimerRef.current);
        clearInterval(countdownTimerRef.current);

        // Reset UI
        setInstruction('Pronto');
        setScale(0.6);
    };

    // Update volume real-time
    React.useEffect(() => {
        if (masterGainRef.current) masterGainRef.current.gain.value = dingVolume;
        if (bgAudioRef.current) bgAudioRef.current.volume = musicVolume;
    }, [dingVolume, musicVolume]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => handleStop();
    }, []);

    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-full pb-32">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <LungIcon className="w-8 h-8 text-sky-600" />
                    <h1 className="text-3xl font-bold text-slate-800">Coerenza Cardiaca</h1>
                </div>
                
                {/* SETTINGS CARD */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8 space-y-4">
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => !isActive && setMode('open')}
                            disabled={isActive}
                            className={`flex-1 py-2 rounded-md text-sm font-bold flex justify-center items-center gap-2 transition-all ${mode === 'open' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            <EyeIcon className="w-4 h-4" /> Visiva
                        </button>
                        <button
                            onClick={() => !isActive && setMode('closed')}
                            disabled={isActive}
                            className={`flex-1 py-2 rounded-md text-sm font-bold flex justify-center items-center gap-2 transition-all ${mode === 'closed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            <EyeOffIcon className="w-4 h-4" /> Sonora
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <select 
                            value={duration}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setDuration(v);
                                setTimeLeft(v);
                            }}
                            disabled={isActive}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium disabled:opacity-50"
                        >
                            {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>

                        <select 
                            value={patternKey}
                            onChange={(e) => setPatternKey(e.target.value)}
                            disabled={isActive}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium disabled:opacity-50"
                        >
                            {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => <option key={key} value={key}>{pat.name}</option>)}
                        </select>

                        <select 
                            value={musicTrack}
                            onChange={(e) => setMusicTrack(e.target.value)}
                            disabled={isActive}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium disabled:opacity-50"
                        >
                            {MUSIC_TRACKS.map(track => <option key={track.label} value={track.value}>{track.label}</option>)}
                        </select>
                    </div>

                    {/* Volume Controls */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-12">Musica</span>
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))}
                                className="flex-grow h-2 bg-slate-200 rounded-lg accent-sky-500"
                            />
                        </div>
                        {mode === 'closed' && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-400 w-12">Ding</span>
                                <input 
                                    type="range" min="0" max="1" step="0.01" 
                                    value={dingVolume} onChange={e => setDingVolume(parseFloat(e.target.value))}
                                    className="flex-grow h-2 bg-slate-200 rounded-lg accent-emerald-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ANIMAZIONE */}
                <div className="relative w-72 h-72 mx-auto my-8 flex items-center justify-center">
                    <div className={`absolute inset-0 bg-sky-200 rounded-full blur-2xl opacity-30 transition-transform duration-[4000ms] ${isActive ? 'scale-110' : 'scale-100'}`}></div>
                    
                    <div 
                        className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 rounded-full shadow-2xl flex items-center justify-center transition-all ease-in-out z-10 relative"
                        style={{ 
                            transform: `scale(${scale})`,
                            // Usiamo CSS transition per rendere fluido il movimento anche se JS lagga
                            transitionDuration: isActive 
                                ? (instruction === 'Inspira' ? `${BREATHING_PATTERNS[patternKey].inhale}s` : `${BREATHING_PATTERNS[patternKey].exhale}s`) 
                                : '0.5s'
                        }}
                    >
                        <div className="w-[94%] h-[94%] rounded-full bg-white/10 backdrop-blur-sm border border-white/20"></div>
                    </div>

                    <div className="absolute z-20 text-center pointer-events-none">
                        <span className="block text-4xl font-black text-slate-800 drop-shadow-md tracking-wider uppercase">
                            {instruction}
                        </span>
                        {isActive && instruction === 'Trattieni' && (
                            <span className="text-sm font-bold text-slate-500 mt-1 block tracking-widest">HOLD</span>
                        )}
                    </div>
                </div>

                {/* STATISTICHE */}
                <div className="flex justify-between items-center px-6 mb-8">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cicli</p>
                        <p className="text-3xl font-bold text-slate-700">{cycles}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tempo</p>
                        <p className="text-3xl font-bold text-slate-700 font-mono tabular-nums">
                            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={isActive ? handleStop : handleStart}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${isActive ? 'bg-slate-700 hover:bg-slate-800' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'}`}
                >
                    {isActive ? "Termina Sessione" : "Inizia Respirazione"}
                </button>
            </div>

            {/* AUDIO PLAYER NASCOSTO */}
            <audio 
                ref={bgAudioRef} 
                loop 
                playsInline 
                // Su iOS questo DEVE essere visibile logicamente anche se hidden con CSS
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default BreathingScreen;
