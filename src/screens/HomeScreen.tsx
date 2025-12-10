
import React from 'react';
import WellnessScore from '../components/WellnessScore';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { AreaChartIcon } from '../components/icons/AreaChartIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { LungIcon } from '../components/icons/LungIcon';
import { CalendarClockIcon } from '../components/icons/CalendarClockIcon';
import { BriefcaseMedicalIcon } from '../components/icons/BriefcaseMedicalIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';


const HomeScreen = ({ user, onNavigate }) => {
    const homeCards = [
      { id: 'assessments', title: 'Test Autovalutazione', subtitle: 'Scopri il tuo benessere', Icon: BookOpenIcon },
      { id: 'dashboard', title: 'Dashboard Benessere', subtitle: 'Visualizza i tuoi progressi', Icon: AreaChartIcon },
      { id: 'wellnessRoutine', title: 'Routine Benessere', subtitle: 'Completa le tue missioni', Icon: SparklesIcon },
      { id: 'breathing', title: 'Meditazione Guidata', subtitle: 'Esercizi di respirazione', Icon: LungIcon },
      { id: 'spaBookings', title: 'Percorsi SPA', subtitle: 'Scopri i percorsi benessere', Icon: CalendarClockIcon },
      { id: 'analysisQuote', title: 'Analisi & Preventivi', subtitle: 'Crea il tuo piano di analisi', Icon: ClipboardListIcon },
      { id: 'prescriptions', title: 'Invio Ricette Mediche', subtitle: 'Invia ricette alla farmacia', Icon: DocumentTextIcon },
      { id: 'pharmacyServices', title: 'Servizi Farmacia', subtitle: 'Telemedicina e altro', Icon: BriefcaseMedicalIcon },
    ];
  
    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800">Bentornato, {user.name}!</h1>
                <p className="text-xl text-slate-600">Il tuo coach personale per il benessere.</p>
            </header>
            
            <WellnessScore user={user} onNavigate={onNavigate} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {homeCards.map(card => (
                    <div
                        key={card.id}
                        onClick={() => onNavigate(card.id)}
                        className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between items-start cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slide-in-up"
                    >
                        <div>
                            <div className="p-3 bg-sky-100 rounded-full mb-4 inline-block">
                                <card.Icon className="w-8 h-8 text-sky-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800">{card.title}</h2>
                            <p className="text-slate-500 mt-1">{card.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HomeScreen;
