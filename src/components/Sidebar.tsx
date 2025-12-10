
import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { UserIcon } from './icons/UserIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { AreaChartIcon } from './icons/AreaChartIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LungIcon } from './icons/LungIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { CalendarClockIcon } from './icons/CalendarClockIcon';
import { BriefcaseMedicalIcon } from './icons/BriefcaseMedicalIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { LoginIcon } from './icons/LoginIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { UsersIcon } from './icons/UsersIcon';

const Sidebar = ({ user, currentPage, onNavigate, onLogout, isOpen, setIsOpen }) => {
    const navItems = [
        { id: 'home', label: 'Home', Icon: HomeIcon },
        { id: 'profile', label: 'Profilo', Icon: UserIcon },
        { id: 'assessments', label: 'Test Autovalutazione', Icon: BookOpenIcon },
        { id: 'dashboard', label: 'Wellness Dashboard', Icon: AreaChartIcon },
        { id: 'wellnessRoutine', label: 'Routine Benessere', Icon: SparklesIcon },
        { id: 'breathing', label: 'Meditazione Guidata', Icon: LungIcon },
        { id: 'community', label: 'Community & Coach', Icon: UsersIcon },
    ];
    
    // Spostato bloodAnalysis in fondo come richiesto
    const spaItems = [
        { id: 'analysisQuote', label: 'Analisi & Preventivi', Icon: ClipboardListIcon },
        { id: 'spaBookings', label: 'Percorsi SPA', Icon: CalendarClockIcon },
        { id: 'bloodAnalysis', label: 'Analisi Referti (Coming Soon)', Icon: BeakerIcon },
    ];

    const pharmacyItems = [
        { id: 'prescriptions', label: 'Invio Ricette', Icon: DocumentTextIcon },
        { id: 'pharmacyServices', label: 'Servizi Farmacia', Icon: BriefcaseMedicalIcon },
    ];

    const NavLink: React.FC<{ item: { id: string; label: string; Icon: React.ElementType } }> = ({ item }) => (
        <li>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.id);
                    if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={`flex items-center gap-3 p-3 my-1 rounded-md text-lg transition-colors ${
                    currentPage === item.id 
                    ? 'bg-sky-500 text-white shadow-md' 
                    : 'text-sky-100 hover:bg-sky-600'
                }`}
            >
                <item.Icon className="sidebar-icon" />
                <span>{item.label}</span>
            </a>
        </li>
    );

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-sky-700">
                <h1 className="text-xl font-bold text-white">Clinical Wellness Spa</h1>
                {user && <p className="text-sky-200 text-sm">Benvenuto, {user.name}</p>}
            </div>
            <nav className="flex-grow p-2 overflow-y-auto">
                <ul>
                    {navItems.map(item => <NavLink key={item.id} item={item} />)}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-sky-700">
                    <h2 className="px-3 py-1 text-sm font-semibold text-sky-300 uppercase tracking-wider">Clinical Wellness SPA</h2>
                    <ul>
                        {spaItems.map(item => <NavLink key={item.id} item={item} />)}
                    </ul>
                </div>
                
                <div className="my-2 border-t border-sky-700" />
                
                <div className="mt-2 pt-2">
                     <h2 className="px-3 py-1 text-sm font-semibold text-sky-300 uppercase tracking-wider">Servizi Farmacia Centrale</h2>
                    <ul>
                        {pharmacyItems.map(item => <NavLink key={item.id} item={item} />)}
                    </ul>
                </div>

            </nav>
            <div className="p-4 border-t border-sky-700 mt-auto">
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onLogout();
                        if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 rounded-md text-lg text-sky-100 hover:bg-sky-600 transition-colors"
                >
                    <LoginIcon className="sidebar-icon" />
                    <span>Logout</span>
                </a>
            </div>
        </>
    );

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && <div className="fixed inset-0 bg-black opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>}
            
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-64 bg-sky-800 text-white flex flex-col shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                {sidebarContent}
            </aside>
        </>
    );
};

export default Sidebar;
