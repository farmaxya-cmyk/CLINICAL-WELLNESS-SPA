
import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

// Un MP3 di silenzio puro (1 secondo). Serve a tenere sveglio il thread audio di iOS/Android.
const SILENT_TRACK = "data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRTU0UAAAAPAAADTGF2ZjU3LjU2LjEwMAAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAJAAAB3AAZGRkZGRkZGRkZGRkZGRkZGRlxcXFxcXFxcXFxcXFxcXFxcXF5eXl5eXl5eXl5eXl5eXl5eXl5/////////////////////wAAADFMYXZjNTcuNjQuMTAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA//oeAAAAAAAAAAAAAAAAAAAAAAAUDUDAAAAAAAAAAAAAABAAAAAAAAAAAAAA";

const BreathingScreen = () => {
    const BREATHING_PATTERNS = {
      coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5, total: 10 },
      vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6, total: 10 },
      sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8, total: 19 },
      training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6, total: 12 },
    };

    const MUSIC_TRACKS = [
        { label: '🔕 Silenzio (Solo Ding)', value: SILENT_TRACK },
        { label: '🎵 Relax (432Hz Healing)', value: 'https://files.catbox.moe/zc81yy.mp3' },
        { label: '🧠 Mind (Attivazione)', value: 'audio/Comunicativita.mp3' },
        { label: '🧘 Introspection (Profondità)', value: 'audio/Perdono.mp3' },
        { label: '🌈 7 Chakra (Armonizzazione)', value: 'audio/7-chackra.mp3' },
    ];

    const DURATION_OPTIONS = [
        { label: '1 Minuto (Test)', value: 60 },
        { label: '5 Minuti', value: 300 },
        { label: '10 Minuti', value: 600 },
        { label: '15 Minuti', value: 900 },
        { label: '30 Minuti', value: 1800 },
    ];

    const [duration, setDuration] = React.useState(DURATION_OPTIONS[1].value);
    const [patternKey, setPatternKey] = React.useState('coherence');
    const [musicTrack, setMusicTrack] = React.useState(MUSIC_TRACKS[1].value); // Default musica
    const [isActive, setIsActive] = React.useState(false);
    
    // Visual states
    const [instruction, setInstruction] = React.useState('Inizia');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(duration);
    const [cycles, setCycles] = React.useState(0);
    
    // Settings
    const [mode, setMode] = React.useState<'open' | 'closed'>('closed');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.9); // Alto di default
    
    // Refs
    const audioRef = React.useRef<HTMLAudioElement>(null); 
    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const masterGainRef = React.useRef<GainNode | null>(null);
    const dingGainRef = React.useRef<GainNode | null>(null);
    
    // Buffers generati
    const dingInhaleBuffer = React.useRef<AudioBuffer | null>(null);
    const dingExhaleBuffer = React.useRef<AudioBuffer | null>(null);
    
    const scheduledNodesRef = React.useRef<AudioScheduledSourceNode[]>([]); 
    const visualTimerRef = React.useRef<any>(null);

    // --- SINTESI SONORA (Genera suoni di campana puri) ---
    // Questo crea un suono matematicamente perfetto, impossibile che sia muto.
    const synthesizeBell = (ctx: AudioContext, frequency: number, duration: number): AudioBuffer => {
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // Sintesi additiva: Fondamentale + Armoniche per effetto "Campana Tibetana"
            const amplitude = 
                1.0 * Math.sin(2 * Math.PI * frequency * t) * Math.exp(-2 * t) + // Fondamentale (Decadimento medio)
                0.6 * Math.sin(2 * Math.PI * (frequency * 2.05) * t) * Math.exp(-2.5 * t) + // Armonica inarmonica (Metal sound)
                0.3 * Math.sin(2 * Math.PI * (frequency * 3.1) * t) * Math.exp(-5 * t); // Brillantezza (Decadimento veloce)
            
            data[i] = amplitude * 0.8; // Scaling volume globale per evitare clipping
        }
        return buffer;
    };

    const initAudioEngine = () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;
            
            // Catena: Ding -> DingGain -> Master -> Out
            masterGainRef.current = ctx.createGain();
            dingGainRef.current = ctx.createGain();
            
            dingGainRef.current.connect(masterGainRef.current);
            masterGainRef.current.connect(ctx.destination);
            
            // Genera i suoni (Campana Alta per Inhale, Campana Bassa per Exhale)
            dingInhaleBuffer.current = synthesizeBell(ctx, 528, 2.5); // 528Hz (Frequenza DNA/Amore)
            dingExhaleBuffer.current = synthesizeBell(ctx, 396, 3.5); // 396Hz (Frequenza Radicamento)
        }
    };

    // --- EFFECT: Volume ---
    React.useEffect(() => {
        if (audioRef.current) audioRef.current.volume = musicVolume;
        // Aggiorna il guadagno dei ding in tempo reale
        if (dingGainRef.current && audioCtxRef.current) {
            const target = mode === 'closed' ? dingVolume : 0;
            dingGainRef.current.gain.setTargetAtTime(target, audioCtxRef.current.currentTime, 0.1);
        }
    }, [musicVolume, dingVolume, mode]);

    // --- EFFECT: Music Track Change ---
    React.useEffect(() => {
        if (audioRef.current) {
            // Se la traccia cambia, ricarica
            if (!audioRef.current.src.includes(musicTrack)) {
                audioRef.current.src = musicTrack;
                if (isActive) audioRef.current.play().catch(e => console.error(e));
            }
        }
    }, [musicTrack, isActive]);


    // --- SCHEDULING ---
    const scheduleSound = (buffer: AudioBuffer | null, time: number) => {
        if (!buffer || !audioCtxRef.current || !dingGainRef.current) return;
        const ctx = audioCtxRef.current;
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(dingGainRef.current);
        source.start(time);
        scheduledNodesRef.current.push(source);
    };

    const scheduleFullSession = () => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const pattern = BREATHING_PATTERNS[patternKey];
        
        const now = ctx.currentTime;
        let cursorTime = now + 0.5; // Breve pausa prima di iniziare
        const endTime = now + duration;

        stopAudioEngine(); // Pulisci vecchi eventi

        while (cursorTime < endTime) {
            // 1. Inhale (Ding Alto)
            scheduleSound(dingInhaleBuffer.current, cursorTime);
            cursorTime += pattern.inhale;

            // 2. Hold (Silenzio)
            if (pattern.hold > 0) cursorTime += pattern.hold;

            // 3. Exhale (Ding Basso)
            if (cursorTime < endTime) scheduleSound(dingExhaleBuffer.current, cursorTime);
            cursorTime += pattern.exhale;
        }
    };

    const stopAudioEngine = () => {
        scheduledNodesRef.current.forEach(node => {
            try { node.stop(); } catch(e) {}
            try { node.disconnect(); } catch(e) {}
        });
        scheduledNodesRef.current = [];
    };

    // --- HANDLERS ---
    const handleStart = async () => {
        initAudioEngine();
        const ctx = audioCtxRef.current;
        
        if (ctx?.state === 'suspended') await ctx.resume();

        setIsActive(true);
        setTimeLeft(duration); // Reset timer visivo

        // 1. AVVIA MUSICA DI BACKGROUND (CRUCIALE PER IL FREEZE)
        if (audioRef.current) {
            audioRef.current.src = musicTrack; // Assicura che la src sia corretta
            audioRef.current.volume = musicVolume;
            // Se l'utente ha scelto "Silenzio", suona comunque il file muto per tenere attiva la CPU audio
            audioRef.current.play().catch(e => alert("Tocca lo schermo per attivare l'audio"));
        }

        // 2. PROGRAMMA I DING
        scheduleFullSession();
    };

    const handleStop = () => {
        setIsActive(false);
        stopAudioEngine();
        
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // Reset visuale
        setInstruction('Inizia');
        setScale(0.6);
        setCycles(0);
        setTimeLeft(duration);
    };

    // --- LOOP VISIVO (Solo Feedback UI) ---
    React.useEffect(() => {
        if (isActive) {
            const pattern = BREATHING_PATTERNS[patternKey];
            
            const runVisual = () => {
                if (!isActive) return;
                
                setInstruction('Inspira');
                setScale(1);
                
                visualTimerRef.current = setTimeout(() => {
                    if (pattern.hold > 0) setInstruction('Trattieni');
                    
                    const holdDelay = pattern.hold * 1000;
                    
                    setTimeout(() => {
                        setInstruction('Espira');
                        setScale(0.6);
                        
                        setTimeout(() => {
                            setCycles(c => c + 1);
                            if (isActive) runVisual();
                        }, pattern.exhale * 1000);
                    }, holdDelay);
                    
                }, pattern.inhale * 1000);
            };
            
            runVisual();

            // Timer Countdown
            const endTimestamp = Date.now() + (duration * 1000);
            const interval = setInterval(() => {
                const remaining = Math.ceil((endTimestamp - Date.now()) / 1000);
                if (remaining <= 0) {
                    handleStop();
                    clearInterval(interval);
                } else {
                    setTimeLeft(remaining);
                }
            }, 1000);

            return () => {
                clearTimeout(visualTimerRef.current);
                clearInterval(interval);
            };
        }
    }, [isActive]);

    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-full pb-32">
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
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'open' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <EyeIcon className="w-4 h-4" />
                                Visiva
                            </button>
                            <button
                                onClick={() => setMode('closed')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'closed' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <EyeOffIcon className="w-4 h-4" />
                                Guidata
                            </button>
                        </div>
                    </div>
                    {mode === 'open' ? (
                        <p className="text-xs text-slate-400 text-center italic">Campana tibetana disattivata.</p>
                    ) : (
                        <p className="text-xs text-emerald-600 text-center italic font-semibold">Campana tibetana attiva (anche a schermo spento).</p>
                    )}

                    {/* Duration */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">⏱️ Durata</label>
                        <select 
                            value={duration} 
                            onChange={e => { setDuration(Number(e.target.value)); setTimeLeft(Number(e.target.value)); }}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                        >
                            {DURATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {/* Pattern */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-sm font-bold text-slate-600 uppercase flex items-center gap-2">🫁 Ritmo</label>
                        <select 
                            value={patternKey}
                            onChange={e => setPatternKey(e.target.value)}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                        >
                            {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => <option key={key} value={key}>{pat.name}</option>)}
                        </select>
                    </div>

                    {/* Music */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-sky-50 rounded-lg border border-sky-100">
                        <label className="text-sm font-bold text-sky-700 uppercase flex items-center gap-2">🎵 Sottofondo</label>
                        <select 
                            value={musicTrack}
                            onChange={e => setMusicTrack(e.target.value)}
                            disabled={isActive}
                            className="w-full sm:w-2/3 p-2 bg-white border border-sky-200 rounded-lg text-slate-700 shadow-sm"
                        >
                            {MUSIC_TRACKS.map(track => <option key={track.label} value={track.value}>{track.label}</option>)}
                        </select>
                    </div>

                    {/* Volumes */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-600 uppercase w-20">Musica</label>
                            <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg accent-sky-500" />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-bold text-slate-600 uppercase w-20">Campana</label>
                            <input type="range" min="0" max="1" step="0.01" value={dingVolume} onChange={(e) => setDingVolume(parseFloat(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg accent-sky-500" />
                        </div>
                    </div>
                </div>

                {/* Animation Circle */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mx-auto my-8">
                    <div className={`absolute w-full h-full bg-sky-200 rounded-full opacity-50 ${isActive ? 'animate-pulse' : ''}`}></div>
                    <div 
                        className="absolute w-full h-full bg-sky-400 rounded-full shadow-2xl flex items-center justify-center transition-all ease-in-out"
                        style={{ 
                            transform: `scale(${scale})`,
                            transitionDuration: isActive ? (instruction === 'Inspira' ? `${BREATHING_PATTERNS[patternKey].inhale}s` : `${BREATHING_PATTERNS[patternKey].exhale}s`) : '1s'
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
                    {isActive ? <>⏸️ Ferma Sessione</> : <>▶️ Inizia Meditazione</>}
                </button>
            </div>
            
            {/* 
               CRUCIALE: Questo player audio DEVE rimanere sempre renderizzato.
               Se l'utente sceglie "Silenzio", riproduce un MP3 vuoto in loop.
               Questo "inganna" iOS/Android facendo credere che un media sia in riproduzione,
               mantenendo attivo l'AudioContext per i Ding generati.
            */}
            <audio 
                ref={audioRef} 
                loop
                playsInline
                onError={(e) => console.error("Errore background music", e)}
            />
        </div>
    );
};

export default BreathingScreen;
