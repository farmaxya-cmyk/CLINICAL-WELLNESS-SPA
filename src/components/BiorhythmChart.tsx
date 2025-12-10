
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
    birthDate: Date;
    targetDate: Date;
}

export const calculateBiorhythm = (birthDate: Date, targetDate: Date, cycle: number) => {
    const diffTime = targetDate.getTime() - birthDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return Math.sin((2 * Math.PI * diffDays) / cycle) * 100;
};

export const BiorhythmChart: React.FC<Props> = ({ birthDate, targetDate }) => {
    // Generate data for -3 days to +10 days from target
    const labels: string[] = [];
    const physicalData: number[] = [];
    const emotionalData: number[] = [];
    const intellectualData: number[] = [];

    for (let i = -2; i <= 12; i++) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() + i);
        
        const label = i === 0 ? 'Oggi' : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
        labels.push(label);

        physicalData.push(calculateBiorhythm(birthDate, d, 23));
        emotionalData.push(calculateBiorhythm(birthDate, d, 28));
        intellectualData.push(calculateBiorhythm(birthDate, d, 33));
    }

    const data = {
        labels,
        datasets: [
            {
                label: 'Fisico (Energia)',
                data: physicalData,
                borderColor: 'rgb(22, 163, 74)', // Green-600
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                tension: 0.4,
                pointRadius: (ctx: any) => ctx.dataIndex === 2 ? 6 : 0, // Highlight "Today" (index 2)
                pointHoverRadius: 6,
            },
            {
                label: 'Emozionale',
                data: emotionalData,
                borderColor: 'rgb(249, 115, 22)', // Orange-500
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                tension: 0.4,
                pointRadius: (ctx: any) => ctx.dataIndex === 2 ? 6 : 0,
                pointHoverRadius: 6,
            },
            {
                label: 'Intellettuale (Mente)',
                data: intellectualData,
                borderColor: 'rgb(14, 165, 233)', // Sky-500
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                tension: 0.4,
                pointRadius: (ctx: any) => ctx.dataIndex === 2 ? 6 : 0,
                pointHoverRadius: 6,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false // Hide default legend to use custom one with icons
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                min: -100,
                max: 100,
                grid: {
                    color: (context: any) => context.tick.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                    lineWidth: (context: any) => context.tick.value === 0 ? 2 : 1,
                },
                ticks: {
                    display: false // Hide numbers to keep it clean
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    return (
        <div className="w-full h-64">
            <Line data={data} options={options} />
        </div>
    );
};
