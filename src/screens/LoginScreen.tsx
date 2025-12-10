
import React from 'react';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';

const LoginScreen = ({ onLogin }) => {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && email.trim()) {
            const userData = { name: name.trim(), email: email.trim() };
            onLogin(userData);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-slate-800">Clinical Wellness Spa</h1>
                    <p className="mt-2 text-lg text-slate-600">Il tuo percorso verso il benessere inizia qui.</p>
                </div>
                <div className="bg-white shadow-2xl rounded-2xl p-8 animate-fade-in">
                    <div className="text-center mb-8">
                        <UserCircleIcon className="mx-auto h-16 w-16 text-sky-600 mb-4" />
                        <h2 className="text-2xl font-bold text-slate-800">Area Riservata</h2>
                        <p className="mt-1 text-slate-500">Accedi per continuare</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="Il tuo nome"
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">Indirizzo Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                                placeholder="indirizzo@esempio.com"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={!name.trim() || !email.trim()}
                                className="group relative w-full flex justify-center py-3 px-4 mt-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Accedi
                            </button>
                        </div>
                    </form>
                </div>
                <p className="mt-6 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} Clinical Wellness Spa. Tutti i diritti riservati.
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
