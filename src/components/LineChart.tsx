import React from 'react';

export const LineChart = ({ data, width = 400, height = 200, color = "#0ea5e9" }) => {
    if (!data || data.length < 2) {
        return <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">Dati insufficienti per il grafico.</div>;
    }

    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const yMax = 80;
    const yMin = 20;

    const getX = (index) => (index / (data.length - 1)) * chartWidth + padding;
    const getY = (score) => chartHeight - ((score - yMin) / (yMax - yMin)) * chartHeight + padding;

    const path = data
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.score)}`)
        .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" aria-label="Grafico dell'andamento dei punteggi">
            <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {data.map((d, i) => (
                <g key={i} className="group">
                    <circle cx={getX(i)} cy={getY(d.score)} r="5" fill="white" stroke={color} strokeWidth="2" className="transition-all duration-300 group-hover:r-7" />
                    <rect x={getX(i) - 40} y={getY(d.score) - 35} width="80" height="25" rx="4" fill="#1e293b" opacity="0" className="group-hover:opacity-90 transition-opacity duration-200 pointer-events-none" />
                    <text x={getX(i)} y={getY(d.score) - 20} textAnchor="middle" fill="white" fontSize="10" opacity="0" className="group-hover:opacity-100 transition-opacity duration-200 pointer-events-none font-bold">
                        {d.score} ({new Date(d.date).toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit'})})
                    </text>
                </g>
            ))}
            <text x={padding - 5} y={getY(yMin)} textAnchor="end" dominantBaseline="middle" className="text-xs fill-slate-400 font-medium">{yMin}</text>
            <text x={padding - 5} y={getY(yMax)} textAnchor="end" dominantBaseline="middle" className="text-xs fill-slate-400 font-medium">{yMax}</text>
        </svg>
    );
};