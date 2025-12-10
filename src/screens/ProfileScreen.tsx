import React from 'react';
import { UserIcon } from '../components/icons/UserIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import { SettingsIcon } from '../components/icons/SettingsIcon';

const ProfileScreen = ({ user, onLogout, onNavigate }) => {
    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-slate-800 mb-8">Profilo Utente</h1>
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md mx-auto">
                <div className="text-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-sky-100 mx-auto flex items-center justify-center mb-4">
                        <UserIcon className="w-12 h-12 text-sky-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                    <p className="text-slate-500">{user.email}</p>
                </div>
                <div className="border-t border-slate-200 pt-6 space-y-4">
                    <button
                        onClick={() => onNavigate('adminSettings')}
                        className="w-full bg-slate-600 text-white font-semibold py-3 rounded-lg hover:bg-slate-700 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                        <SettingsIcon className="w-5 h-5"/>
                        <span>Impostazioni Punteggi</span>
                    </button>
                    <button
                        onClick={() => onNavigate('manualUnlock')}
                        className="w-full bg-sky-600 text-white font-semibold py-3 rounded-lg hover:bg-sky-700 transition-colors shadow-md flex items-center justify-center gap-2"
                    >
                        <KeyIcon className="w-5 h-5"/>
                        <span>Sblocco Manuale Livelli</span>
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;