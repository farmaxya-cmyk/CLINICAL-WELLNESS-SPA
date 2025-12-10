
import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { WellnessScores, CompositeScores } from '../utils/wellnessCalculations';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Props {
    scores: WellnessScores;
    composites: CompositeScores;
}

export const WellnessRadarChart: React.FC<Props> = ({ scores, composites }) => {
    const data = {
        labels: [
            'Fitness',
            'Sonno',
            'Dietetica',
            'Stress',
            'Microbioma',
            'ENERGIA',
            'MENTE',
            'EMOZIONI'
        ],
        datasets: [
            {
                label: 'Il Tuo Profilo Benessere',
                data: [
                    scores.fitness,
                    scores.sleep,
                    scores.diet,
                    scores.stress,
                    scores.microbiome,
                    composites.body,
                    composites.mind,
                    composites.emotions
                ],
                backgroundColor: 'rgba(14, 165, 233, 0.2)', // sky-500 con trasparenza
                borderColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                pointBorderColor: 'rgba(14, 165, 233, 1)',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(14, 165, 233)',
                spanGaps: true, 
            },
            {
                label: 'Obiettivo Ottimale',
                data: [80, 80, 80, 80, 80, 80, 80, 80],
                backgroundColor: 'rgba(16, 185, 129, 0.05)', // green-500 molto trasparente
                borderColor: 'rgba(16, 185, 129, 0.4)',
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [5, 5],
            }
        ],
    };

    // Helper per ottenere il colore in base al punteggio
    const getColorForScore = (val: number | null) => {
        if (val === null) return '#94a3b8'; // slate-400 (Dati mancanti)
        if (val < 40) return '#ef4444'; // red-500
        if (val < 70) return '#f59e0b'; // amber-500
        return '#10b981'; // emerald-500
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: {
                    stepSize: 20,
                    backdropColor: 'transparent',
                    font: {
                        size: 10
                    }
                },
                pointLabels: {
                    font: {
                        size: 13, // Font leggermente più grande per leggibilità
                        weight: 'bold' as const,
                        family: "'Inter', sans-serif"
                    },
                    // Logica colore dinamica per TUTTE le etichette
                    color: (context: any) => {
                        const label = context.label;
                        let val: number | null = null;

                        // Mappatura label -> valore
                        switch(label) {
                            case 'Fitness': val = scores.fitness; break;
                            case 'Sonno': val = scores.sleep; break;
                            case 'Dietetica': val = scores.diet; break;
                            case 'Stress': val = scores.stress; break;
                            case 'Microbioma': val = scores.microbiome; break;
                            case 'ENERGIA': val = composites.body; break;
                            case 'MENTE': val = composites.mind; break;
                            case 'EMOZIONI': val = composites.emotions; break;
                        }

                        // Colori specifici per i macro-gruppi (override della logica punteggio se si vuole un colore fisso per il nome, 
                        // ma la richiesta chiede colorazione in base al valore o colore specifico acquisito. 
                        // Mantengo i colori specifici per i macro e uso la logica del punteggio per i test singoli, 
                        // OPPURE coloro i macro in base al loro valore. 
                        // La richiesta dice: "applicherei loro i colori rosso arancione verde che hanno acquisito dai test".
                        
                        // Per Energia, Mente, Emozioni uso i loro colori distintivi se il dato c'è, altrimenti fallback
                        if (label === 'ENERGIA' && val !== null) return '#059669'; // Emerald-600 fisso per distinguere il titolo
                        if (label === 'MENTE' && val !== null) return '#0284c7'; // Sky-600 fisso
                        if (label === 'EMOZIONI' && val !== null) return '#ea580c'; // Orange-600 fisso
                        
                        // Per le voci singole (Fitness, ecc.), applico il semaforo
                        return getColorForScore(val);
                    }
                }
            },
        },
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.r !== null) {
                            label += context.parsed.r + '%';
                        } else {
                            label += 'Dati mancanti';
                        }
                        return label;
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="w-full h-[400px] flex justify-center items-center">
            <Radar data={data} options={options} />
        </div>
    );
};
