
import React from 'react';

// Utils
import { getStoredJSON } from './utils/storage';

// Data
import { assessmentsData } from './data/assessmentsData';
import { wellnessProgramsData as defaultWellnessData } from './data/wellnessProgramsData';


// Components
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import { MenuIcon } from './components/icons/MenuIcon';
import { XIcon } from './components/icons/XIcon';
import { OnboardingModal } from './components/OnboardingModal';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import QuizScreen from './screens/QuizScreen';
import ResultsScreen from './screens/ResultsScreen';
import WellnessDashboard from './screens/WellnessDashboard';
import { WellnessRoutineScreen } from './screens/WellnessRoutineScreen';
import BreathingScreen from './screens/BreathingScreen';
import SpaBookingsScreen from './screens/SpaBookingsScreen';
import PharmacyServicesScreen from './screens/PharmacyServicesScreen';
import AnalysisQuoteScreen from './screens/AnalysisQuoteScreen';
import ManualUnlockScreen from './screens/ManualUnlockScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import AdminSettingsScreen from './screens/AdminSettingsScreen';
import BloodAnalysisScreen from './screens/BloodAnalysisScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { WellnessVisualizerScreen } from './screens/WellnessVisualizerScreen';


// Types
import { User, WellnessProgramsData } from './types';

const App = () => {
    // State management
    const [user, setUser] = React.useState<User | null>(null);
    const [currentPage, setCurrentPage] = React.useState('home');
    const [isSidebarOpen, setSidebarOpen] = React.useState(false);
    const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [wellnessData, setWellnessData] = React.useState<WellnessProgramsData>(defaultWellnessData);
    const [showOnboarding, setShowOnboarding] = React.useState(false);

    
    // Assessment flow state
    const [activeAssessmentId, setActiveAssessmentId] = React.useState<string | null>(null);
    const [lastAssessmentResult, setLastAssessmentResult] = React.useState<{ id: string; score: number; answers?: Record<number, number> } | null>(null);

    const loadWellnessData = React.useCallback(() => {
        const customData = getStoredJSON('customWellnessProgramsData', null);
        if (customData && Object.keys(customData).length > 0) {
            setWellnessData(customData);
        } else {
            // First load or reset, initialize local storage with default data
            try {
                localStorage.setItem('customWellnessProgramsData', JSON.stringify(defaultWellnessData));
            } catch (e) {
                console.error("Failed to save default wellness data:", e);
            }
            setWellnessData(defaultWellnessData);
        }
    }, []);

    // Load user and dynamic wellness data from localStorage on initial render
    React.useEffect(() => {
        const storedUser = getStoredJSON('user', null);
        if (storedUser) {
            setUser(storedUser);
            // Check if profile is complete
            if (!storedUser.age || !storedUser.gender) {
                setShowOnboarding(true);
            }
        }
        loadWellnessData();
    }, [loadWellnessData]);

    // Handlers
    const handleLogin = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Check for onboarding immediately after login
        if (!userData.age || !userData.gender) {
            setShowOnboarding(true);
        }
        
        setCurrentPage('home');
    };

    const handleUpdateProfile = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowOnboarding(false);
        showNotification('Profilo aggiornato con successo!', 'success');
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        setCurrentPage('home'); // Reset to home for next login
    };

    const handleNavigate = (page: string) => {
        setActiveAssessmentId(null);
        setLastAssessmentResult(null);
        setCurrentPage(page);
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    };

    const handleStartAssessment = (assessmentId: string) => {
        setActiveAssessmentId(assessmentId);
        setLastAssessmentResult(null);
    };

    const handleCompleteAssessment = (score: number, answers?: Record<number, number>) => {
        if (!activeAssessmentId || !user) return;
        
        // FIX IMPORTANTE: Salviamo anche 'answers' per permettere il calcolo della galenica
        const result = { 
            id: activeAssessmentId, 
            score, 
            date: new Date().toISOString(),
            answers: answers 
        };
        
        // Save to history
        const historyKey = `assessmentHistory_${user.email}_${activeAssessmentId}`;
        const history = getStoredJSON(historyKey, []);
        history.push(result);
        localStorage.setItem(historyKey, JSON.stringify(history));

        setLastAssessmentResult({ id: activeAssessmentId, score, answers });
        setActiveAssessmentId(null); // End of quiz, show results
    };

    const handleRetakeAssessment = () => {
        if (lastAssessmentResult) {
            setActiveAssessmentId(lastAssessmentResult.id);
            setLastAssessmentResult(null);
        }
    };
    
    // Render logic
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const renderContent = () => {
        if (activeAssessmentId) {
            return <QuizScreen assessment={assessmentsData[activeAssessmentId]} onComplete={handleCompleteAssessment} />;
        }
        if (lastAssessmentResult) {
            return <ResultsScreen assessment={assessmentsData[lastAssessmentResult.id]} score={lastAssessmentResult.score} answers={lastAssessmentResult.answers} onRetake={handleRetakeAssessment} onBackToHome={() => handleNavigate('assessments')} />;
        }
        
        switch (currentPage) {
            case 'home': return <HomeScreen user={user} onNavigate={handleNavigate} />;
            case 'profile': return <ProfileScreen user={user} onLogout={handleLogout} onNavigate={handleNavigate} />;
            case 'assessments': return <AssessmentScreen user={user} onStartAssessment={handleStartAssessment} onNavigate={handleNavigate} />;
            case 'dashboard': return <WellnessDashboard user={user} onNavigate={handleNavigate} />;
            case 'wellnessRoutine': return <WellnessRoutineScreen user={user} showNotification={showNotification} wellnessData={wellnessData} />;
            case 'breathing': return <BreathingScreen />;
            case 'spaBookings': return <SpaBookingsScreen user={user} showNotification={showNotification} />;
            case 'pharmacyServices': return <PharmacyServicesScreen user={user} showNotification={showNotification} />;
            case 'bloodAnalysis': return <BloodAnalysisScreen user={user} />;
            case 'analysisQuote': return <AnalysisQuoteScreen user={user} showNotification={showNotification} onNavigate={handleNavigate} />;
            case 'prescriptions': return <PrescriptionScreen user={user} showNotification={showNotification} />;
            case 'manualUnlock': return <ManualUnlockScreen user={user} onNavigate={handleNavigate} showNotification={showNotification} wellnessData={wellnessData} />;
            case 'adminSettings': return <AdminSettingsScreen onSettingsSaved={loadWellnessData} showNotification={showNotification} />;
            case 'community': return <CommunityScreen />;
            case 'visualizer': return <WellnessVisualizerScreen />;
            default: return <HomeScreen user={user} onNavigate={handleNavigate} />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {notification && <Notification notification={notification} onClose={() => setNotification(null)} />}
            
            {showOnboarding && <OnboardingModal user={user} onSave={handleUpdateProfile} />}

            <Sidebar user={user} currentPage={currentPage} onNavigate={handleNavigate} onLogout={handleLogout} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            
            <main className="flex-1 overflow-y-auto md:ml-64">
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    className="md:hidden fixed top-4 right-4 z-50 p-2 bg-sky-600 text-white rounded-full shadow-lg"
                    aria-label={isSidebarOpen ? "Chiudi menu" : "Apri menu"}
                >
                    {isSidebarOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
