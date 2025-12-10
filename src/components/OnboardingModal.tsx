
import React from 'react';
import { User } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface Props {
    user: User;
    onSave: (updatedUser: User) => void;
}

export const OnboardingModal: React.FC<Props> = ({ user, onSave }) => {
    const [gender, setGender] = React.useState<'male' | 'female' | ''>('');
    const [age, setAge] = React.useState('');
    const [height, setHeight] = React.useState('');
    const [weight, setWeight] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (gender && age && height && weight) {
            onSave({
                ...user,
                gender: gender as 'male' | 'female',
                age: parseInt(age),
                height: parseInt(height),
                weight: parseInt(weight)
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-sky-600 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Benvenuto in Clinical Wellness</h2>
                    <p className="text-sky-100 mt-2">Configuriamo il tuo profilo biometrico per iniziare.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Sesso Biologico</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center transition-all ${gender === 'male' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} className="hidden" />
                                <span className="text-2xl mb-1">👨</span>
                                <span className="font-semibold">Uomo</span>
                            </label>
                            <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center transition-all ${gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 hover:border-slate-300'}`}>
                                <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} className="hidden" />
                                <span className="text-2xl mb-1">👩</span>
                                <span className="font-semibold">Donna</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Età</label>
                            <input 
                                type="number" 
                                min="1" max="120"
                                value={age} 
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-center font-bold text-slate-800"
                                placeholder="Anni"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Altezza</label>
                            <input 
                                type="number" 
                                min="50" max="250"
                                value={height} 
                                onChange={(e) => setHeight(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-center font-bold text-slate-800"
                                placeholder="CM"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso</label>
                            <input 
                                type="number" 
                                min="20" max="300"
                                value={weight} 
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-center font-bold text-slate-800"
                                placeholder="KG"
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={!gender || !age || !height || !weight}
                        className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        <span>Crea il mio Profilo Salute</span>
                        <CheckCircleIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};
