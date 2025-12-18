
import React from 'react';
import { LungIcon } from '../components/icons/LungIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeOffIcon } from '../components/icons/EyeOffIcon';

const SILENT_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
const AUDIO_VER = "v5_" + Date.now(); // Token unico ad ogni refresh

const BreathingScreen = () => {
    const BREATHING_PATTERNS = {
      coherence: { name: '5-5 Coerenza Cardiaca', inhale: 5, hold: 0, exhale: 5 },
      vagotonia: { name: '4-6 Vagotonia', inhale: 4, hold: 0, exhale: 6 },
      sleep: { name: '4-7-8 Sonno', inhale: 4, hold: 7, exhale: 8 },
      training: { name: '6-6 Allenamento', inhale: 6, hold: 0, exhale: 6 },
    };

    const MUSIC_TRACKS = [
        { label: '🔕 Silenzio (Solo Ding)', value: SILENT_WAV },
        { label: '🎵 Relax (Healing)', value: `https://files.catbox.moe/zc81yy.mp3?v=${AUDIO_VER}` },
        { label: '🧘 7 Chakra', value: `https://files.catbox.moe/j5j66e.mp3?v=${AUDIO_VER}` },
        { label: '🧠 Mind', value: `https://files.catbox.moe/ad01.mp3?v=${AUDIO_VER}` },
        { label: '🔮 Introspezione', value: `https://files.catbox.moe/w2234a.mp3?v=${AUDIO_VER}` },
    ];

    const [duration, setDuration] = React.useState(300);
    const [patternKey, setPatternKey] = React.useState('coherence');
    const [musicTrack, setMusicTrack] = React.useState(MUSIC_TRACKS[1].value);
    const [isActive, setIsActive] = React.useState(false);
    const [audioError, setAudioError] = React.useState('');
    const [instruction, setInstruction] = React.useState('Pronto');
    const [scale, setScale] = React.useState(0.6);
    const [timeLeft, setTimeLeft] = React.useState(300);
    const [cycles, setCycles] = React.useState(0);
    const [mode, setMode] = React.useState<'open' | 'closed'>('closed');
    const [musicVolume, setMusicVolume] = React.useState(0.5);
    const [dingVolume, setDingVolume] = React.useState(0.8);

    const audioCtxRef = React.useRef<AudioContext | null>(null);
    const masterGainRef = React.useRef<GainNode | null>(null);
    const bgAudioRef = React.useRef<HTMLAudioElement>(null);
    const scheduledNodesRef = React.useRef<AudioScheduledSourceNode[]>([]);
    const visualTimerRef = React.useRef<any>(null);
    const countdownTimerRef = React.useRef<any>(null);

    const scheduleDing = (ctx: AudioContext, destination: AudioNode, time: number, pitch: number) => {
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = pitch;
            osc.connect(gain);
            gain.connect(destination);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(1, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
            osc.start(time);
            osc.stop(time + 2.5);
            scheduledNodesRef.current.push(osc);
        } catch (e) {}
    };

    const scheduleEntireSession = (ctx: AudioContext) => {
        const now = ctx.currentTime;
        let cursor = now + 0.1;
        const endTime = now + duration;
        const pattern = BREATHING_PATTERNS[patternKey];
        while (cursor < endTime) {
            scheduleDing(ctx, masterGainRef.current!, cursor, 432);
            cursor += pattern.inhale + pattern.hold;
            if (cursor < endTime) scheduleDing(ctx, masterGainRef.current!, cursor, 216);
            cursor += pattern.exhale;
        }
    };

    const startVisuals = () => {
        const pattern = BREATHING_PATTERNS[patternKey];
        const loop = () => {
            if (!isActive) return;
            setInstruction('Inspira'); setScale(1);
            visualTimerRef.current = setTimeout(() => {
                if (pattern.hold > 0) {
                    setInstruction('Trattieni');
                    visualTimerRef.current = setTimeout(() => {
                        setInstruction('Espira'); setScale(0.6);
                        visualTimerRef.current = setTimeout(() => { setCycles(c => c + 1); loop(); }, pattern.exhale * 1000);
                    }, pattern.hold * 1000);
                } else {
                    setInstruction('Espira'); setScale(0.6);
                    visualTimerRef.current = setTimeout(() => { setCycles(c => c + 1); loop(); }, pattern.exhale * 1000);
                }
            }, pattern.inhale * 1000);
        };
        loop();
    };

    const handleStart = async () => {
        setAudioError('');
        setIsActive(true);
        setTimeLeft(duration);
        setCycles(0);
        startVisuals();

        countdownTimerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { handleStop(); return 0; }
                return prev - 1;
            });
        }, 1000);

        try {
            if (!audioCtxRef.current) {
                const AC = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AC();
                masterGainRef.current = audioCtxRef.current.createGain();
                masterGainRef.current.connect(audioCtxRef.current.destination);
            }
            if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
            masterGainRef.current!.gain.value = dingVolume;
            if (mode === 'closed') scheduleEntireSession(audioCtxRef.current);

            if (bgAudioRef.current) {
                bgAudioRef.current.src = musicTrack;
                bgAudioRef.current.volume = musicVolume;
                bgAudioRef.current.load(); // CRITICO: Forza il ricaricamento del buffer
                await bgAudioRef.current.play();
            }
        } catch (err) {
            console.error(err);
            setAudioError("Inizializzazione audio fallita. Tocca di nuovo.");
        }
    };

    const handleStop = () => {
        setIsActive(false);
        scheduledNodesRef.current.forEach(n => { try { n.stop(); n.disconnect(); } catch(e){} });
        scheduledNodesRef.current = [];
        if (bgAudioRef.current) { bgAudioRef.current.pause(); bgAudioRef.current.currentTime = 0; }
        clearTimeout(visualTimerRef.current);
        clearInterval(countdownTimerRef.current);
        setInstruction('Pronto'); setScale(0.6);
    };

    React.useEffect(() => {
        if (bgAudioRef.current) bgAudioRef.current.volume = musicVolume;
        if (masterGainRef.current) masterGainRef.current.gain.value = dingVolume;
    }, [musicVolume, dingVolume]);

    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-full pb-32 text-center">
            <div className="w-full max-w-lg bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <LungIcon className="w-8 h-8 text-sky-600" />
                    <h1 className="text-3xl font-bold text-slate-800">Coerenza Cardiaca</h1>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setMode('open')} className={`flex-1 py-2 rounded-lg font-bold flex justify-center items-center gap-2 ${mode === 'open' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-500'}`}><EyeIcon className="w-4 h-4"/>Visiva</button>
                        <button onClick={() => setMode('closed')} className={`flex-1 py-2 rounded-lg font-bold flex justify-center items-center gap-2 ${mode === 'closed' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}><EyeOffIcon className="w-4 h-4"/>Sonora</button>
                    </div>

                    <select value={patternKey} onChange={e => setPatternKey(e.target.value)} disabled={isActive} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                        {Object.entries(BREATHING_PATTERNS).map(([k,v]) => <option key={k} value={k}>{v.name}</option>)}
                    </select>

                    <select value={musicTrack} onChange={e => setMusicTrack(e.target.value)} disabled={isActive} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                        {MUSIC_TRACKS.map(t => <option key={t.label} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                {audioError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">⚠️ {audioError}</div>}

                <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
                    <div className={`absolute inset-0 bg-sky-200 rounded-full blur-2xl opacity-20 transition-transform duration-[4000ms] ${isActive ? 'scale-125' : 'scale-100'}`}></div>
                    <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 rounded-full shadow-2xl transition-all ease-in-out" style={{ transform: `scale(${scale})`, transitionDuration: isActive ? (instruction === 'Inspira' ? `${BREATHING_PATTERNS[patternKey].inhale}s` : `${BREATHING_PATTERNS[patternKey].exhale}s`) : '0.5s' }}></div>
                    <div className="absolute font-black text-3xl text-slate-800 uppercase tracking-tighter drop-shadow-sm">{instruction}</div>
                </div>

                <div className="flex justify-around mb-8">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Cicli</p><p className="text-2xl font-bold">{cycles}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Tempo</p><p className="text-2xl font-mono font-bold">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</p></div>
                </div>

                <button onClick={isActive ? handleStop : handleStart} className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transform active:scale-95 transition-all ${isActive ? 'bg-slate-700' : 'bg-sky-600 hover:bg-sky-700'}`}>
                    {isActive ? "Ferma Sessione" : "Inizia Respirazione"}
                </button>
            </div>
            <audio ref={bgAudioRef} loop playsInline style={{ display: 'none' }} />
        </div>
    );
};

export default BreathingScreen;
