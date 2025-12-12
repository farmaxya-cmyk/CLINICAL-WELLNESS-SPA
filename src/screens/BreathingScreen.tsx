import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

const BreathingScreen = () => {

    // Ritmi di respirazione
    const BREATHING_PATTERNS = {
        coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5, total: 10 },
        vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6, total: 10 },
        sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8, total: 19 },
        training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6, total: 12 },
    };

    // Tracce musicali
    const MUSIC_TRACKS = [
        { label: '🎵 Relax (432Hz Healing)', value: 'https://files.catbox.moe/zc81yy.mp3' },
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

    // Stati principali
    const [duration, setDuration] = React.useState(DURATION_OPTIONS[0].value);
    const [patternKey, setPatternKey] = React.useState('coherence');
    const [musicTrack, setMusicTrack] = React.useState(MUSIC_TRACKS[0].value);
    const [isActive, setIsActive] = React.useState(false);

    // Stati visivi
    const [instruction, setInstruction] = React.useState('Inizia');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(DURATION_OPTIONS[0].value);
    const [cycles, setCycles] = React.useState(0);

    // Modalità sonora / visiva
    const [mode, setMode] = React.useState<'open' | 'closed'>('closed');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.8);

    // Refs audio
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const audioCtxRef = React.useRef<AudioContext | null>(null);

    // I nuovi Ding caricati come AudioBuffer (funzionano a schermo spento!)
    const dingInhaleRef = React.useRef<AudioBuffer | null>(null);
    const dingExhaleRef = React.useRef<AudioBuffer | null>(null);

    // Timer visuale
    const visualTimerRef = React.useRef<any>(null);

    // Carica i Ding una volta al primo click
    const loadDingBuffers = async () => {
        if (!audioCtxRef.current) return;

        const ctx = audioCtxRef.current;

        const load = async (url: string) => {
            const res = await fetch(url);
            const arr = await res.arrayBuffer();
            return await ctx.decodeAudioData(arr);
        };

        dingInhaleRef.current = await load('/audio/ding_inhale.wav');
        dingExhaleRef.current = await load('/audio/ding_exhale.wav');
    };

    // Aggiorna volume musica
    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicVolume;
        }
    }, [musicVolume]);
    //
    // --- SISTEMA DING (FUNZIONA A SCHERMO SPENTO) ---
    //
    const playDing = (type: "inhale" | "exhale") => {
        const ctx = audioCtxRef.current;
        if (!ctx) return;

        const buffer = type === "inhale" ? dingInhaleRef.current : dingExhaleRef.current;
        if (!buffer) return;

        const source = ctx.createBufferSource();
        const gain = ctx.createGain();

        source.buffer = buffer;
        gain.gain.value = mode === "closed" ? dingVolume : 0;

        source.connect(gain).connect(ctx.destination);
        source.start();
    };

    //
    // Start Session
    //
    const handleStart = async () => {
        // 1. Crea AudioContext solo al primo click (mobile requirement)
        if (!audioCtxRef.current) {
            const ACtx = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new ACtx();
        }

        const ctx = audioCtxRef.current;

        if (ctx.state === "suspended") await ctx.resume();

        // 2. Carica i ding se non caricati
        if (!dingInhaleRef.current || !dingExhaleRef.current) {
            await loadDingBuffers();
        }

        // 3. Avvia musica
        if (audioRef.current) {
            audioRef.current.src = musicTrack;
            audioRef.current.volume = musicVolume;
            audioRef.current.loop = true;

            try {
                await audioRef.current.play();
            } catch (e) {
                alert("Tocca lo schermo per abilitare l'audio");
            }
        }

        setIsActive(true);
        setTimeLeft(duration);
        setCycles(0);
        runBreathingCycle();
        startCountdown();
    };

    //
    // Stop Session
    //
    const handleStop = () => {
        setIsActive(false);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        clearTimeout(visualTimerRef.current);
        setInstruction("Inizia");
        setScale(0.6);
        setCycles(0);
    };

    //
    // Ciclo di respirazione (solo VISIVO – i ding funzionano con playDing)
    //
    const runBreathingCycle = () => {
        if (!isActive) return;

        const pattern = BREATHING_PATTERNS[patternKey];

        // INSPIRA
        setInstruction("Inspira");
        setScale(1);
        playDing("inhale");

        const inhaleMs = pattern.inhale * 1000;
        const holdMs = pattern.hold * 1000;
        const exhaleMs = pattern.exhale * 1000;

        // Dopo inspirazione
        visualTimerRef.current = setTimeout(() => {

            if (pattern.hold > 0) {
                setInstruction("Trattieni");

                // Dopo hold
                visualTimerRef.current = setTimeout(() => {
                    startExhale(pattern, exhaleMs);
                }, holdMs);

            } else {
                startExhale(pattern, exhaleMs);
            }

        }, inhaleMs);
    };

    //
    // Funzione separata per ESPIRA
    //
    const startExhale = (pattern: any, exhaleMs: number) => {
        if (!isActive) return;

        setInstruction("Espira");
        setScale(0.6);
        playDing("exhale");

        visualTimerRef.current = setTimeout(() => {
            setCycles(c => c + 1);
            if (isActive) runBreathingCycle();
        }, exhaleMs);
    };

    //
    // COUNTDOWN SESSIONE
    //
    const startCountdown = () => {
        const end = Date.now() + duration * 1000;

        const interval = setInterval(() => {
            if (!isActive) {
                clearInterval(interval);
                return;
            }

            const remaining = Math.ceil((end - Date.now()) / 1000);

            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                handleStop();
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
    };
    //
    // Durata transizione cerchio
    //
    const circleTransitionDuration = isActive
        ? (instruction === 'Inspira'
            ? BREATHING_PATTERNS[patternKey].inhale
            : BREATHING_PATTERNS[patternKey].exhale)
        : 1;

    //
    // RENDER UI
    //
    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-full pb-32">
            <div className="w-full max-w-lg">

                {/* HEADER */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <LungIcon className="w-8 h-8 text-sky-600" />
                    <h1 className="text-3xl font-bold text-slate-800">Meditazione Guidata</h1>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8 space-y-4">

                    {/* MODE */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2 pl-2">
                            👁️ Modalità
                        </label>
                        <div className="flex bg-white rounded-md p-1 border border-slate-200 shadow-sm w-full sm:w-auto">
                            <button
                                onClick={() => setMode('open')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors 
                                    ${mode === 'open' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <EyeIcon className="w-4 h-4" />
                                Visiva
                            </button>
                            <button
                                onClick={() => setMode('closed')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors 
                                    ${mode === 'closed' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <EyeOffIcon className="w-4 h-4" />
                                Guidata
                            </button>
                        </div>
                    </div>

                    {mode === 'open' && (
                        <p className="text-xs text-slate-400 text-center italic">
                            In modalità Visiva i segnali acustici (Ding) sono disattivati.
                        </p>
                    )}

                    {/* DURATA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                            ⏱️ Durata
                        </label>
                        <select
                            value={duration}
                            onChange={e => {
                                setDuration(Number(e.target.value));
                                setTimeLeft(Number(e.target.value));
                            }}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 disabled:opacity-50 text-sm font-medium text-slate-700"
                        >
                            {DURATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* RITMO */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">
                            <LungIcon className="w-4 h-4 text-slate-500" /> Ritmo
                        </label>
                        <select
                            value={patternKey}
                            onChange={e => setPatternKey(e.target.value)}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 disabled:opacity-50 text-sm font-medium text-slate-700"
                        >
                            {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => (
                                <option key={key} value={key}>{pat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* MUSICA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-sky-50 rounded-lg border border-sky-100">
                        <label className="text-sm font-bold text-sky-700 uppercase flex items-center gap-2">
                            🎵 Frequenza
                        </label>
                        <select
                            value={musicTrack}
                            onChange={e => setMusicTrack(e.target.value)}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-white border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 disabled:opacity-50 text-sm font-medium text-slate-700 shadow-sm"
                        >
                            {MUSIC_TRACKS.map(track => (
                                <option key={track.value} value={track.value}>
                                    {track.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* VOLUME */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-600 uppercase w-20">
                                Musica
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={musicVolume}
                                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-600 uppercase w-20">
                                Segnale
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={dingVolume}
                                onChange={(e) => setDingVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                        </div>
                    </div>
                </div>

                {/* CERCHIO ANIMATO */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mx-auto my-8">
                    <div className={`absolute w-full h-full bg-sky-200 rounded-full opacity-50 ${isActive ? 'animate-pulse' : ''}`}></div>

                    <div
                        className="absolute w-full h-full bg-sky-400 rounded-full shadow-2xl flex items-center justify-center transition-all ease-in-out"
                        style={{
                            transform: `scale(${scale})`,
                            transitionDuration: `${circleTransitionDuration}s`,
                        }}
                    >
                        <div className="w-[90%] h-[90%] rounded-full bg-gradient-to-br from-sky-300 to-blue-500 opacity-80"></div>
                    </div>

                    <span className="relative text-3xl md:text-4xl font-extrabold text-white z-10 uppercase tracking-widest drop-shadow-md">
                        {instruction}
                    </span>
                </div>

                {/* STATISTICHE */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cicli</p>
                        <p className="text-3xl font-bold text-slate-700">{cycles}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tempo</p>
                        <p className="text-3xl font-bold text-slate-700 font-mono">
                            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                            {String(timeLeft % 60).padStart(2, '0')}
                        </p>
                    </div>
                </div>

                {/* PULSANTE START/STOP */}
                <button
                    onClick={isActive ? handleStop : handleStart}
                    className={`w-full mt-8 block px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
                        ${isActive
                            ? 'bg-slate-700 hover:bg-slate-800'
                            : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
                        }`}
                >
                    {isActive ? '⏸️ Ferma Sessione' : '▶️ Inizia Meditazione'}
                </button>
            </div>

            {/* PLAYER MUSICA DI SOTTOFONDO */}
            <audio ref={audioRef} preload="auto" loop />
        </div>
    );
};

export default BreathingScreen;
