import React from 'react';
import { UploadCloudIcon } from '../components/icons/UploadCloudIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { PHARMACY_EMAIL, PHARMACY_WHATSAPP_NUMBER } from '../data/constants';
import { getStoredJSON } from '../utils/storage';
import { User } from '../types';

interface PrescriptionHistoryItem {
  id: number;
  date: string;
  files: string[];
}

interface StagedFile {
    file: File;
    previewUrl: string;
    textContent?: string;
}

const PrescriptionScreen = ({ user, showNotification }: { user: User; showNotification: (message: string, type?: 'success' | 'error') => void; }) => {
    const [stagedFiles, setStagedFiles] = React.useState<StagedFile[]>([]);
    const [history, setHistory] = React.useState<PrescriptionHistoryItem[]>([]);
    const storageKey = `prescriptionHistory_${user.email}`;

    React.useEffect(() => {
        const savedHistory = getStoredJSON(storageKey, []);
        setHistory(savedHistory.sort((a: PrescriptionHistoryItem, b: PrescriptionHistoryItem) => b.id - a.id));
    }, [storageKey]);

    React.useEffect(() => {
        return () => {
            stagedFiles.forEach(sf => URL.revokeObjectURL(sf.previewUrl));
        };
    }, [stagedFiles]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFilesPromises = Array.from(e.target.files).map(async (file: File) => {
                let textContent = undefined;
                if (file.type === 'text/plain') {
                    try {
                        textContent = await file.text();
                    } catch (err) {
                        console.error("Error reading text file", err);
                    }
                }
                return {
                    file: file,
                    previewUrl: URL.createObjectURL(file),
                    textContent
                };
            });

            const newFiles = await Promise.all(newFilesPromises);
            
            setStagedFiles(prev => [...prev, ...newFiles]);
            e.target.value = ''; 
        }
    };

    const handleRemoveFile = (indexToRemove: number) => {
        setStagedFiles(prev => {
            const fileToRemove = prev[indexToRemove];
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter((_, index) => index !== indexToRemove);
        });
    };

    const handleSend = (method: 'email' | 'whatsapp') => {
        if (stagedFiles.length === 0) {
            showNotification('Nessuna ricetta da inviare.', 'error');
            return;
        }

        const fileNames = stagedFiles.map(sf => `- ${sf.file.name}`).join('\n');
        
        // Combine text content from .txt files
        const textContents = stagedFiles
            .filter(sf => sf.textContent)
            .map(sf => `--- CONTENUTO DI ${sf.file.name} ---\n${sf.textContent}`)
            .join('\n\n');

        let body = `Buongiorno,\n\nSi richiede la preparazione delle seguenti ricette/note per ${user.name}:\n${fileNames}\n\n`;
        
        if (textContents) {
            body += `NOTE TESTUALI ALLEGATE:\n${textContents}\n\n`;
        }

        body += `(Per file immagini/PDF, sono stati allegati a questa comunicazione)\n\nGrazie,\n${user.name}`;
        
        // Email body optimized
        const emailBody = `Buongiorno,\n\nIn allegato le seguenti ricette mediche per ${user.name}:\n${fileNames}\n\n` + 
                          (textContents ? `NOTE TESTUALI:\n${textContents}\n\n` : '') + 
                          `(Ricorda di allegare manualmente i file PDF/Immagini prima di inviare)\n\nGrazie,\n${user.name}`;

        if (method === 'email') {
            const mailtoLink = `mailto:${PHARMACY_EMAIL}?subject=${encodeURIComponent(`Invio Ricette Mediche - ${user.name}`)}&body=${encodeURIComponent(emailBody)}`;
            window.open(mailtoLink, '_blank');
        } else {
            const whatsappLink = `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`;
            window.open(whatsappLink, '_blank');
        }

        const newHistoryItem: PrescriptionHistoryItem = {
            id: Date.now(),
            date: new Date().toISOString(),
            files: stagedFiles.map(sf => sf.file.name),
        };

        const newHistory = [newHistoryItem, ...history];
        localStorage.setItem(storageKey, JSON.stringify(newHistory));
        setHistory(newHistory);
        
        setStagedFiles([]);
        showNotification('La tua richiesta è pronta per essere inviata!', 'success');
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Invio Ricette & Note</h1>
            <p className="text-xl text-slate-600 mb-8">Carica ricette (PDF, Foto) o note di testo (.txt) da inviare alla farmacia.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Upload and Staging */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">1. Carica file</h2>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors">
                            <input
                                type="file"
                                accept="image/*,.pdf,.txt"
                                multiple
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Carica file"
                            />
                            <div className="flex flex-col items-center text-slate-500 pointer-events-none">
                                <UploadCloudIcon className="w-12 h-12 mb-2 text-sky-500" />
                                <p className="font-semibold text-slate-700">Trascina i file qui o clicca per caricare</p>
                                <p className="text-sm mt-1">Accettati: PDF, Foto (JPG, PNG), Testo (.txt)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h2 className="text-2xl font-bold text-slate-700 mb-4">2. Riepilogo Invio</h2>
                        {stagedFiles.length > 0 ? (
                            <div className="space-y-4">
                                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {stagedFiles.map((stagedFile, index) => (
                                        <li key={`${stagedFile.file.name}-${index}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {stagedFile.file.type.startsWith('image/') ? (
                                                    <img src={stagedFile.previewUrl} alt={stagedFile.file.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                                                ) : stagedFile.file.type === 'text/plain' ? (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-emerald-100 rounded-md flex-shrink-0 text-emerald-600">
                                                        <FileTextIcon className="w-6 h-6" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-md flex-shrink-0 text-red-600">
                                                        <FileTextIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div className="overflow-hidden">
                                                    <span className="font-medium text-slate-700 truncate block" title={stagedFile.file.name}>{stagedFile.file.name}</span>
                                                    <span className="text-xs text-slate-500">
                                                        {Math.round(stagedFile.file.size / 1024)} KB 
                                                        {stagedFile.textContent && <span className="text-emerald-600 font-semibold ml-2">• Testo Letto</span>}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveFile(index)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0">
                                                <XCircleIcon className="w-5 h-5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 mb-3 text-center">
                                        Nota: I file PDF e Immagini dovranno essere allegati manualmente nel client di posta/WhatsApp. Il contenuto dei file .txt verrà copiato automaticamente nel messaggio.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button onClick={() => handleSend('email')} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors shadow-md">
                                            <MailIcon className="w-5 h-5" /> Invia via Email
                                        </button>
                                        <button onClick={() => handleSend('whatsapp')} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors shadow-md">
                                            <WhatsAppIcon className="w-5 h-5" /> Invia via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <FileTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Non hai ancora aggiunto nessuna ricetta.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: History */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">Storico Invii</h2>
                    {history.length > 0 ? (
                        <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {history.map(item => (
                                <li key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-1 rounded">Inviato</span>
                                        <span className="text-xs text-slate-500">{new Date(item.date).toLocaleString('it-IT')}</span>
                                    </div>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        {item.files.map((fileName, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                                {fileName}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center py-16 text-slate-400">
                             <p>Nessuno storico disponibile.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrescriptionScreen;