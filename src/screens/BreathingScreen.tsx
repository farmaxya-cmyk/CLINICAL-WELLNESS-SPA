
import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

// Un MP3 di silenzio puro molto leggero per mantenere attivo il thread audio del browser
const SILENT_MP3 = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAJAAAB3AAZGRkZGRkZGRkZGRkZGRkZGRlxcXFxcXFxcXFxcXFxcXFxcXF5eXl5eXl5eXl5eXl5eXl5eXl5/////////////////////wAAADFMYXZjNTcuNjQuMTAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA";

const BreathingScreen = () => {
    // --- COSTANTI E CONFIGURAZIONE ---
    const BREATHING_PATTERNS = {
      coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5, total: 10 },
      vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6, total: 10 },
      sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8, total: 19 },
      training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6, total: 12 },
    };

    const MUSIC_TRACKS = [
        { label: '🔕 Silenzio (Solo Ding)', value: SILENT_MP3 },
        { label: '🎵 Relax (432Hz Healing)', value: 'https://files.catbox.moe/zc81yy.mp3' },
        { label: '🧠 Mind (Attivazione)', value: 'https://files.catbox.moe/ad01.mp3' }, // Placeholder URL valido
        { label: '🧘 Introspection', value: 'https://files.catbox.moe/ad02.mp3' }, // Placeholder URL valido
    ];

    const DURATION_OPTIONS = [
        { label: '1 Minuto (Test)', value: 60 },
        { label: '5 Minuti', value: 300 },
        { label: '10 Minuti', value: 600 },
        { label: '20 Minuti', value: 1200 },
    ];

    // --- STATO ---
    const [duration, setDuration] = React.useState(DURATION_OPTIONS[1].value);
    const [patternKey, setPatternKey] = React.useState('coherence');
    const [musicTrack, setMusicTrack] = React.useState(MUSIC_TRACKS[1].value);
    const [isActive, setIsActive] = React.useState(false);
    
    // Stato Visuale
    const [instruction, setInstruction] = React.useState('Inizia');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(duration);
    const [cycles, setCycles] = React.useState(0);
    
    // Impostazioni
    const [mode, setMode] = React.useState<'open' | 'closed'>('closed');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.8);

    // --- REFS PER AUDIO ENGINE ---
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const backgroundAudioRef = React.useRef<HTMLAudioElement>(null);
    const masterGainRef = React.useRef<GainNode | null>(null);
    const scheduledNodesRef = React.useRef<AudioScheduledSourceNode[]>([]);
    const timerRef = React.useRef<any>(null); // Per il countdown visivo
    const cycleTimerRef = React.useRef<any>(null); // Per l'animazione visiva

    // Buffer pre-calcolati per evitare lag
    const inhaleBufferRef = React.useRef<AudioBuffer | null>(null);
    const exhaleBufferRef = React.useRef<AudioBuffer | null>(null);

    // --- 1. SINTESI SONORA (Genera Campane Tibetane di Alta Qualità) ---
    const createBellBuffer = (ctx: AudioContext, frequency: number, duration: number) => {
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate); // Stereo
        
        for (let channel = 0; channel < 2; channel++) {
            const nowBuffering = buffer.getChannelData(channel);
            for (let i = 0; i < buffer.length; i++) {
                const t = i / sampleRate;
                // Modello fisico semplificato di una campana
                // Fondamentale + Armoniche non intere (tipiche del metallo)
                const amplitude = 
                    1.0 * Math.sin(2 * Math.PI * frequency * t) * Math.exp(-1.5 * t) + 
                    0.6 * Math.sin(2 * Math.PI * (frequency * 2.05) * t) * Math.exp(-2.0 * t) + 
                    0.4 * Math.sin(2 * Math.PI * (frequency * 3.1) * t) * Math.exp(-2.5 * t) +
                    0.2 * Math.sin(2 * Math.PI * (frequency * 4.2) * t) * Math.exp(-4.0 * t);
                
                // Aggiungi un leggero panning o variazione tra canali se necessario
                nowBuffering[i] = amplitude * 0.5; // Gain scaling per evitare clipping
            }
        }
        return buffer;
    };

    // --- 2. INIZIALIZZAZIONE AUDIO CONTEXT ---
    const initAudioContext = () => {
        if (!audioCtxRef.current) {
            // Supporto cross-browser
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;

            // Nodo Master Volume
            const masterGain = ctx.createGain();
            masterGain.connect(ctx.destination);
            masterGainRef.current = masterGain;

            // Genera i suoni una volta sola
            // 528Hz = Frequenza "Miracolo/DNA", ottima per Inhale
            // 396Hz = Frequenza "Radicamento", ottima per Exhale
            inhaleBufferRef.current = createBellBuffer(ctx, 528, 4.0);
            exhaleBufferRef.current = createBellBuffer(ctx, 396, 5.0);
        }
        return audioCtxRef.current;
    };

    // --- 3. SCHEDULING (CUORE DEL SISTEMA) ---
    // Programma tutti i suoni in anticipo sull'orologio hardware del dispositivo
    const scheduleAudioSequence = (ctx: AudioContext) => {
        if (!masterGainRef.current || !inhaleBufferRef.current || !exhaleBufferRef.current) return;

        const pattern = BREATHING_PATTERNS[patternKey];
        const now = ctx.currentTime;
        const startTime = now + 0.5; // Piccolo delay per sicurezza
        const endTime = startTime + duration;
        
        let cursor = startTime;

        // Pulisce vecchi nodi
        stopAudio();

        // Ciclo di programmazione: calcola tutti gli eventi futuri
        // Questo funziona anche se il telefono va in sleep perché i comandi sono già nel driver audio
        while (cursor < endTime) {
            // Suono Inspira
            const inhaleNode = ctx.createBufferSource();
            inhaleNode.buffer = inhaleBufferRef.current;
            inhaleNode.connect(masterGainRef.current);
            inhaleNode.start(cursor);
            scheduledNodesRef.current.push(inhaleNode);

            // Avanza cursore
            cursor += pattern.inhale;

            // Hold (nessun suono, solo tempo)
            if (pattern.hold > 0) {
                cursor += pattern.hold;
            }

            // Suono Espira (se non abbiamo superato la fine)
            if (cursor < endTime) {
                const exhaleNode = ctx.createBufferSource();
                exhaleNode.buffer = exhaleBufferRef.current;
                exhaleNode.connect(masterGainRef.current);
                exhaleNode.start(cursor);
                scheduledNodesRef.current.push(exhaleNode);
            }

            // Avanza cursore
            cursor += pattern.exhale;
        }
    };

    const stopAudio = () => {
        // Ferma tutti i nodi programmati
        scheduledNodesRef.current.forEach(node => {
            try { node.stop(); } catch(e) {}
            try { node.disconnect(); } catch(e) {}
        });
        scheduledNodesRef.current = [];
    };

    // --- 4. GESTIONE VISUALE (Sincronizzata ma indipendente) ---
    const runVisualLoop = () => {
        if (!isActive) return;
        const pattern = BREATHING_PATTERNS[patternKey];

        setInstruction('Inspira');
        setScale(1);

        cycleTimerRef.current = setTimeout(() => {
            if (!isActive) return;
            
            if (pattern.hold > 0) {
                setInstruction('Trattieni');
                cycleTimerRef.current = setTimeout(() => {
                    if (!isActive) return;
                    startExhaleVisual(pattern);
                }, pattern.hold * 1000);
            } else {
                startExhaleVisual(pattern);
            }
        }, pattern.inhale * 1000);
    };

    const startExhaleVisual = (pattern: any) => {
        setInstruction('Espira');
        setScale(0.6);
        cycleTimerRef.current = setTimeout(() => {
            if (!isActive) return;
            setCycles(c => c + 1);
            runVisualLoop(); // Ricorsione
        }, pattern.exhale * 1000);
    };

    // --- HANDLERS UTENTE ---
    const handleStart = async () => {
        try {
            const ctx = initAudioContext();
            
            // Resume obbligatorio per policy browser
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // 1. Avvia Audio Keeper (Elemento HTML Audio)
            // Questo è fondamentale: un elemento <audio> in loop dice al sistema operativo "Stiamo suonando musica"
            if (backgroundAudioRef.current) {
                backgroundAudioRef.current.src = musicTrack;
                backgroundAudioRef.current.volume = musicVolume;
                backgroundAudioRef.current.play().catch(e => console.warn("Background audio play failed", e));
            }

            // 2. Programma i Ding (Web Audio API)
            // Solo se la modalità non è "Visiva" (in visuale i suoni sono spenti, ma il tempo scorre)
            if (mode === 'closed') {
                scheduleAudioSequence(ctx);
            }

            // 3. Avvia UI
            setIsActive(true);
            setTimeLeft(duration);
            
        } catch (error) {
            console.error("Errore avvio sessione:", error);
            alert("Impossibile avviare l'audio. Riprova interagendo con la pagina.");
        }
    };

    const handleStop = () => {
        setIsActive(false);
        stopAudio();
        
        if (backgroundAudioRef.current) {
            backgroundAudioRef.current.pause();
            backgroundAudioRef.current.currentTime = 0;
        }

        // Cleanup timers
        clearTimeout(cycleTimerRef.current);
        clearInterval(timerRef.current);

        // Reset UI
        setInstruction('Inizia');
        setScale(0.6);
        setCycles(0);
        setTimeLeft(duration);
    };

    // --- EFFETTI ---
    
    // Aggiornamento Volume Real-time
    React.useEffect(() => {
        if (masterGainRef.current) {
            // Smooth transition per evitare "pop"
            masterGainRef.current.gain.setTargetAtTime(dingVolume, audioCtxRef.current?.currentTime || 0, 0.1);
        }
        if (backgroundAudioRef.current) {
            backgroundAudioRef.current.volume = musicVolume;
        }
    }, [dingVolume, musicVolume]);

    // Timer Countdown Visivo
    React.useEffect(() => {
        if (isActive) {
            runVisualLoop();
            
            const endTime = Date.now() + (duration * 1000);
            timerRef.current = setInterval(() => {
                const remaining = Math.ceil((endTime - Date.now()) / 1000);
                if (remaining <= 0) {
                    handleStop();
                } else {
                    setTimeLeft(remaining);
                }
            }, 1000);
        }
        return () => {
            clearTimeout(cycleTimerRef.current);
            clearInterval(timerRef.current);
        };
    }, [isActive]);

    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-full pb-32">
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <LungIcon className="w-8 h-8 text-sky-600" />
                    <h1 className="text-3xl font-bold text-slate-800">Meditazione Guidata</h1>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8 space-y-4">
                    
                    {/* Controls Row */}
                    <div className="flex justify-center mb-4">
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => !isActive && setMode('open')}
                                disabled={isActive}
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'open' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                <EyeIcon className="w-4 h-4" /> Visiva
                            </button>
                            <button
                                onClick={() => !isActive && setMode('closed')}
                                disabled={isActive}
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'closed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                <EyeOffIcon className="w-4 h-4" /> Sonora
                            </button>
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-600">Durata</label>
                            <select 
                                value={duration}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setDuration(val);
                                    setTimeLeft(val);
                                }}
                                disabled={isActive}
                                className="p-2 border border-slate-300 rounded-md text-sm w-40"
                            >
                                {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-600">Ritmo</label>
                            <select 
                                value={patternKey}
                                onChange={(e) => setPatternKey(e.target.value)}
                                disabled={isActive}
                                className="p-2 border border-slate-300 rounded-md text-sm w-40"
                            >
                                {Object.entries(BREATHING_PATTERNS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-slate-600">Sottofondo</label>
                            <select 
                                value={musicTrack}
                                onChange={(e) => setMusicTrack(e.target.value)}
                                disabled={isActive}
                                className="p-2 border border-slate-300 rounded-md text-sm w-40 truncate"
                            >
                                {MUSIC_TRACKS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 w-16">Musica</span>
                            <input 
                                type="range" min="0" max="1" step="0.05" 
                                value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))}
                                className="flex-grow h-2 bg-slate-200 rounded-lg accent-sky-500"
                            />
                        </div>
                        {mode === 'closed' && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-16">Ding</span>
                                <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={dingVolume} onChange={e => setDingVolume(parseFloat(e.target.value))}
                                    className="flex-grow h-2 bg-slate-200 rounded-lg accent-emerald-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Visualizer */}
                <div className="relative w-64 h-64 mx-auto my-8 flex items-center justify-center">
                    {/* Outer glow */}
                    <div className={`absolute inset-0 bg-sky-200 rounded-full blur-xl opacity-30 transition-transform duration-[4000ms] ${isActive ? 'scale-110' : 'scale-100'}`}></div>
                    
                    {/* Breathing Circle */}
                    <div 
                        className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 rounded-full shadow-2xl flex items-center justify-center transition-all ease-in-out z-10"
                        style={{ 
                            transform: `scale(${scale})`,
                            transitionDuration: isActive 
                                ? (instruction === 'Inspira' ? `${BREATHING_PATTERNS[patternKey].inhale}s` : `${BREATHING_PATTERNS[patternKey].exhale}s`) 
                                : '0.5s'
                        }}
                    >
                        <div className="w-[92%] h-[92%] rounded-full bg-white/10 backdrop-blur-sm border border-white/20"></div>
                    </div>

                    {/* Text Overlay */}
                    <div className="absolute z-20 text-center pointer-events-none">
                        <span className="block text-4xl font-black text-slate-800 drop-shadow-md tracking-wider uppercase">
                            {instruction}
                        </span>
                        {isActive && instruction === 'Trattieni' && (
                            <span className="text-xs font-bold text-slate-500 mt-1 block">Hold</span>
                        )}
                    </div>
                </div>

                {/* Stats & Action */}
                <div className="flex justify-between items-center px-4 mb-6">
                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase">Cicli</p>
                        <p className="text-2xl font-bold text-slate-700">{cycles}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase">Tempo</p>
                        <p className="text-2xl font-bold text-slate-700 font-mono">
                            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={isActive ? handleStop : handleStart}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isActive ? 'bg-slate-700 hover:bg-slate-800' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'}`}
                >
                    {isActive ? "Termina Sessione" : "Inizia Pratica"}
                </button>
            </div>

            {/* Hidden Audio Keeper */}
            <audio 
                ref={backgroundAudioRef} 
                loop 
                playsInline 
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default BreathingScreen;
