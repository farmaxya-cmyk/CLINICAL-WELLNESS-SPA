
import React from 'react';
import { WellnessScores, CompositeScores } from '../utils/wellnessCalculations';
import { BrainSvg, EnergySkeletonSvg, EmotionsOrbSvg } from './icons/WellnessIcons';

interface Props {
    scores: WellnessScores;
    composites: CompositeScores;
    gender: 'male' | 'female';
}

export const LongevityBody: React.FC<Props> = ({ scores, composites, gender }) => {
    
    // Note: Paths are relative (no leading slash) to work in subdirectories/GitHub Pages
    const femaleImage = "body_female.png"; 
    const maleImage = "body_male.png";
    
    const getColor = (v: number | null) => {
        if (v === null) return '#94a3b8'; // slate-400
        if (v < 40) return '#ef4444'; // red-500
        if (v < 70) return '#f59e0b'; // amber-500
        return '#10b981'; // emerald-500
    };

    const totalTests = 5;
    const validScores = Object.values(scores).filter((s): s is number => s !== null);
    const completedTests = validScores.length;
    const completionPercentage = Math.round((completedTests / totalTests) * 100);

    // Wellness Index Calculation
    const sumScores = validScores.reduce((a, b) => a + b, 0);
    const wellnessIndex = completedTests > 0 ? Math.round(sumScores / completedTests) : null;

    const getWellnessIndexColorClass = (val: number | null) => {
        if (val === null) return 'text-slate-400';
        if (val <= 50) return 'text-red-500';
        if (val <= 60) return 'text-amber-500';
        if (val <= 80) return 'text-emerald-500';
        return 'text-sky-500';
    };

    // Helper for SVG labels
    const SvgLabel = ({ x, y, align, label, value, targetY }: { x: number, y: number, align: 'start' | 'end', label: string, value: number | null, targetY: number }) => {
        const color = getColor(value);
        // Coordinates for the connecting line end point (at body)
        // Adjusted slightly for the image width
        const lineEndX = align === 'end' ? 180 : 220; 

        return (
            <g className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-default group">
                {/* Connection Line */}
                <line 
                    x1={x} y1={y} 
                    x2={lineEndX} y2={targetY} 
                    stroke={color} 
                    strokeWidth="2" 
                    strokeDasharray="4,2" 
                    opacity="0.4" 
                    className="group-hover:opacity-100 transition-opacity"
                />
                
                {/* Percentage Bubble - with strong shadow */}
                <rect 
                    x={align === 'end' ? x - 52 : x} 
                    y={y - 16} 
                    width="54" 
                    height="34" 
                    rx="12" 
                    fill="white" 
                    stroke={color} 
                    strokeWidth="2.5"
                    filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.15))"
                />
                
                {/* Value Text */}
                <text 
                    x={align === 'end' ? x - 25 : x + 27} 
                    y={y + 1} 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    fill={color} 
                    fontWeight="800" 
                    fontSize="15" 
                    fontFamily="sans-serif"
                >
                    {value !== null ? `${value}%` : '-'}
                </text>

                {/* Label Text */}
                <text 
                    x={align === 'end' ? x - 60 : x + 62} 
                    y={y} 
                    textAnchor={align} 
                    dominantBaseline="middle" 
                    fill="#475569" // slate-600
                    fontSize="11" 
                    fontWeight="800"
                    fontFamily="sans-serif"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                    {label}
                </text>
                
                {/* Dot at body connection */}
                 <circle cx={lineEndX} cy={targetY} r="4" fill={color} stroke="white" strokeWidth="2" />
            </g>
        );
    };

    return (
        <div className="flex flex-col w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-full relative">
            
            {/* Wellness Index & Progress Section - Compact Layout */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 z-10">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wellness Index</span>
                        <span className={`text-3xl font-extrabold ${getWellnessIndexColorClass(wellnessIndex)} leading-none`}>
                            {wellnessIndex !== null ? `${wellnessIndex}%` : '-'}
                        </span>
                    </div>
                    <div className="flex flex-col items-end w-1/2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Profilo {completionPercentage}%</span>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-sky-400 to-sky-600 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="relative flex-grow flex flex-col items-center justify-center p-2 bg-gradient-to-b from-white via-sky-50/30 to-slate-100/50 min-h-[400px]">
                 <svg viewBox="0 0 400 480" className="w-full h-auto max-h-[480px] drop-shadow-xl select-none">
                    <defs>
                        {/* Enhanced Glow Filter for the image */}
                        <filter id="bodyGlow" x="-50%" y="-50%" width="200%" height="200%">
                             <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                             <feMerge>
                                 <feMergeNode in="coloredBlur"/>
                                 <feMergeNode in="SourceGraphic"/>
                             </feMerge>
                        </filter>
                    </defs>
                    
                    {/* Body Image with Glow */}
                    <image 
                        href={gender === 'male' ? maleImage : femaleImage} 
                        x="50" 
                        y="-20" 
                        width="300" 
                        height="400" 
                        preserveAspectRatio="xMidYMid meet"
                        filter="url(#bodyGlow)"
                        opacity="0.9"
                    />

                    {/* Labels Mapped to Body Parts - Adjusted for image positioning */}
                    
                    {/* HEAD Area - y=70 approx */}
                    <SvgLabel x={110} y={60} align="end" label="SONNO" value={scores.sleep} targetY={60} />
                    <SvgLabel x={290} y={60} align="start" label="STRESS" value={scores.stress} targetY={60} />

                    {/* CHEST Area - y=150 approx */}
                    <SvgLabel x={290} y={160} align="start" label="FITNESS" value={scores.fitness} targetY={160} />

                    {/* GUT Area - y=250 approx */}
                    <SvgLabel x={110} y={260} align="end" label="DIETA" value={scores.diet} targetY={260} />
                    <SvgLabel x={290} y={260} align="start" label="MICROBIOMA" value={scores.microbiome} targetY={280} />

                </svg>

                {/* Bottom Summary Section - Reordered: Energia - Mente - Emozioni */}
                <div className="w-full px-4 pb-6">
                     <div className="flex flex-wrap justify-center items-start gap-4 sm:gap-8">
                        
                        {/* Energia - Body/Lightning (Verde) - PRIMO */}
                        <div className="flex flex-col items-center group cursor-default w-20 sm:w-24">
                             <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 ${composites.body !== null ? 'border-emerald-500 text-emerald-800 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-white'} shadow-xl shadow-emerald-100/50 group-hover:scale-105 transition-transform duration-300 relative z-10`}>
                                <span className="text-sm sm:text-lg font-extrabold">{composites.body !== null ? `${composites.body}%` : '-'}</span>
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-600 mt-2 mb-1 uppercase tracking-wide group-hover:text-emerald-700 transition-colors">Energia</span>
                            
                            {/* Icona stilizzata Energia (Verde/Blu) */}
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center group-hover:shadow-lg transition-all">
                                <EnergySkeletonSvg className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                            </div>
                        </div>

                        {/* Mente - Brain (Blu) - SECONDO */}
                        <div className="flex flex-col items-center group cursor-default w-20 sm:w-24">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 ${composites.mind !== null ? 'border-sky-500 text-sky-700 bg-sky-50' : 'border-slate-200 text-slate-400 bg-white'} shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10`}>
                                <span className="text-sm sm:text-lg font-extrabold">{composites.mind !== null ? `${composites.mind}%` : '-'}</span>
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-2 mb-1 uppercase tracking-wide group-hover:text-sky-600 transition-colors">Mente</span>
                            
                            {/* Icona stilizzata Cervello (Blu Elettrico) */}
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:shadow-lg transition-all">
                                <BrainSvg className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                            </div>
                        </div>

                        {/* Emozioni - Orb/Heart (Arancione) - TERZO */}
                        <div className="flex flex-col items-center group cursor-default w-20 sm:w-24">
                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 ${composites.emotions !== null ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-slate-200 text-slate-400 bg-white'} shadow-lg group-hover:scale-105 transition-transform duration-300 relative z-10`}>
                                <span className="text-sm sm:text-lg font-extrabold">{composites.emotions !== null ? `${composites.emotions}%` : '-'}</span>
                            </div>
                             <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-2 mb-1 uppercase tracking-wide group-hover:text-orange-600 transition-colors">Emozioni</span>
                             
                             {/* Icona stilizzata Emozioni (Arancione/Oro) */}
                             <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center group-hover:shadow-lg transition-all">
                                <EmotionsOrbSvg className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                            </div>
                        </div>
                     </div>
                </div>

            </div>
        </div>
    );
};
