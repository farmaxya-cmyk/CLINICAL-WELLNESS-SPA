
import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

// CRITICO: Base64 di un MP3 silenzioso. 
// Usare un file locale garantisce che l'audio parta ISTANTANEAMENTE al click,
// attivando la sessione audio di iOS senza attendere il buffering di rete.
const SILENT_AUDIO_URI = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAJAAAB3AAZGRkZGRkZGRkZGRkZGRkZGRlxcXFxcXFxcXFxcXFxcXFxcXF5eXl5eXl5eXl5eXl5eXl5eXl5/////////////////////wAAADFMYXZjNTcuNjQuMTAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA";

const BreathingScreen = () => {
    // --- CONFIGURAZIONE ---
    const BREATHING_PATTERNS = {
      coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5 },
      vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6 },
      sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8 },
      training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6 },
    };

    const MUSIC_TRACKS = [
        { label: '🔕 Silenzio (Solo Ding)', value: SILENT_AUDIO_URI },
        { label: '🎵 Relax (432Hz)', value: 'https://files.catbox.moe/zc81yy.mp3' },
        { label: '🌊 Onde del Mare', value: 'https://files.catbox.moe/ad01.mp3' },
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
    
    // UI Visuale (Separata dall'audio)
    const [instruction, setInstruction] = React.useState('Pronto');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(duration);
    const [cycles, setCycles] = React.useState(0);
    
    // Settings
    const [mode, setMode] = React.useState<'open' | 'closed'>('closed');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.8);

    // --- REFS PER AUDIO ENGINE ---
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const masterGainRef = React.useRef<GainNode | null>(null);
    const bgAudioRef = React.useRef<HTMLAudioElement>(null);
    const wakeLockRef = React.useRef<any>(null);
    
    // Liste per tenere traccia dei nodi audio programmati (per poterli fermare)
    const scheduledNodesRef = React.useRef<AudioScheduledSourceNode[]>([]);
    
    // Timer visivi (possono "freezare", non importa, l'audio è gestito a parte)
    const visualTimerRef = React.useRef<any>(null);
    const countdownTimerRef = React.useRef<any>(null);

    // --- 1. WAKE LOCK (Tenta di tenere lo schermo acceso) ---
    const toggleWakeLock = async (active: boolean) => {
        try {
            if (active && 'wakeLock' in navigator) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            } else if (!active && wakeLockRef.current) {
                await wakeLockRef.current.release();
                wakeLockRef.current = null;
            }
        } catch (err) {
            console.warn('Wake Lock error:', err);
        }
    };

    // --- 2. SINTESI SONORA (Genera Gong) ---
    // Crea un suono tipo campana tibetana usando oscillatori
    const scheduleDing = (ctx: AudioContext, destination: AudioNode, time: number, pitch: number) => {
        // Oscillatore Principale (Fondamentale)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = pitch;

        // Oscillatore Armonico (Per dare "metallo" al suono)
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = pitch * 2.5; 

        // Gain (Volume Envelope)
        const gain = ctx.createGain();
        const gain2 = ctx.createGain();

        // Connessioni
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(destination);
        gain2.connect(destination);

        // Busta del volume (Attack veloce, Release lungo)
        const attack = 0.05;
        const decay = 2.5;

        // Programmazione nel futuro
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(1, time + attack);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        gain2.gain.setValueAtTime(0, time);
        gain2.gain.linearRampToValueAtTime(0.1, time + attack); // Armonica più bassa
        gain2.gain.exponentialRampToValueAtTime(0.001, time + decay);

        // Start/Stop
        osc.start(time);
        osc.stop(time + decay + 1);
        osc2.start(time);
        osc2.stop(time + decay + 1);

        // Salviamo i riferimenti per poter stoppare tutto se l'utente preme stop
        scheduledNodesRef.current.push(osc);
        scheduledNodesRef.current.push(osc2);
    };

    // --- 3. SCHEDULING (Il cuore anti-freeze) ---
    const scheduleEntireSession = (ctx: AudioContext) => {
        const now = ctx.currentTime;
        // Aggiungiamo un piccolo ritardo (0.1s) per assicurarci che non sia nel passato
        let cursor = now + 0.1; 
        const endTime = now + duration;
        const pattern = BREATHING_PATTERNS[patternKey];

        // Pulizia array nodi precedenti
        scheduledNodesRef.current = [];

        // Ciclo che calcola TUTTI i respiri da qui alla fine della sessione
        // E li invia al driver audio in un colpo solo.
        while (cursor < endTime) {
            
            // Suono INSPIRA (Tono più alto)
            scheduleDing(ctx, masterGainRef.current!, cursor, 432); // 432Hz

            cursor += pattern.inhale;

            if (pattern.hold > 0) {
                // Opzionale: suono leggero per il "trattieni" o silenzio
                cursor += pattern.hold;
            }

            // Suono ESPIRA (Tono più basso)
            if (cursor < endTime) {
                scheduleDing(ctx, masterGainRef.current!, cursor, 216); // Ottava bassa
            }

            cursor += pattern.exhale;
        }
    };

    // --- 4. GESTIONE VISUALE (Sincronizzata ma indipendente) ---
    // Questo gira sul main thread. Se si blocca, l'audio continua comunque.
    // Quando si sblocca, si riallinea col timer.
    const startVisuals = () => {
        const pattern = BREATHING_PATTERNS[patternKey];
        
        const loop = () => {
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

    // --- HANDLERS ---
    const handleStart = async () => {
        try {
            // 1. Inizializza AudioContext (deve essere fatto su click utente)
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
                
                // Crea Master Gain per i Ding
                const masterGain = audioCtxRef.current.createGain();
                masterGain.gain.value = dingVolume;
                masterGain.connect(audioCtxRef.current.destination);
                masterGainRef.current = masterGain;
            }

            // Resume context (necessario su Chrome/iOS)
            if (audioCtxRef.current?.state === 'suspended') {
                await audioCtxRef.current.resume();
            }

            // 2. Avvia Background Track (HTML5 Audio)
            // Questo è fondamentale per iOS: se c'è musica che suona, l'app non viene sospesa
            if (bgAudioRef.current) {
                // Imposta la sorgente. Se l'utente ha scelto "Silenzio", usiamo il base64
                // che non richiede rete e parte istantaneamente.
                bgAudioRef.current.src = musicTrack;
                bgAudioRef.current.volume = musicVolume;
                
                // Play deve essere una risposta diretta al click
                await bgAudioRef.current.play();
            }

            // 3. Programma TUTTI i suoni ora
            if (mode === 'closed' && audioCtxRef.current) {
                scheduleEntireSession(audioCtxRef.current);
            }

            // 4. Avvia UI e WakeLock
            toggleWakeLock(true);
            setIsActive(true);
            setCycles(0);
            setTimeLeft(duration);
            
            startVisuals();

            // Timer per il countdown generale (UI only)
            const endTimeMs = Date.now() + (duration * 1000);
            countdownTimerRef.current = setInterval(() => {
                const remaining = Math.ceil((endTimeMs - Date.now()) / 1000);
                if (remaining <= 0) {
                    handleStop();
                } else {
                    setTimeLeft(remaining);
                }
            }, 1000);

        } catch (error) {
            console.error("Errore start:", error);
            alert("Errore avvio audio. Assicurati che il volume sia alto e il tasto silenzioso disattivato.");
        }
    };

    const handleStop = () => {
        setIsActive(false);
        toggleWakeLock(false);

        // Ferma i suoni programmati
        scheduledNodesRef.current.forEach(node => {
            try { node.stop(); node.disconnect(); } catch (e) {}
        });
        scheduledNodesRef.current = [];

        // Ferma musica background
        if (bgAudioRef.current) {
            bgAudioRef.current.pause();
            bgAudioRef.current.currentTime = 0;
        }

        // Pulisce timers
        clearTimeout(visualTimerRef.current);
        clearInterval(countdownTimerRef.current);

        // Reset UI
        setInstruction('Pronto');
        setScale(0.6);
    };

    // Update volumi in tempo reale
    React.useEffect(() => {
        if (masterGainRef.current) masterGainRef.current.gain.value = dingVolume;
        if (bgAudioRef.current) bgAudioRef.current.volume = musicVolume;
    }, [dingVolume, musicVolume]);

    // Cleanup
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
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                        >
                            {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>

                        <select 
                            value={patternKey}
                            onChange={(e) => setPatternKey(e.target.value)}
                            disabled={isActive}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                        >
                            {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => <option key={key} value={key}>{pat.name}</option>)}
                        </select>

                        <select 
                            value={musicTrack}
                            onChange={(e) => setMusicTrack(e.target.value)}
                            disabled={isActive}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
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

            {/* AUDIO PLAYER NASCOSTO PER BACKGROUND MODE */}
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
