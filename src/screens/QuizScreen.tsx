
import React from 'react';

const QuizScreen = ({ assessment, onComplete }) => {
    const [answers, setAnswers] = React.useState<Record<number, number>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
    const [showFitnessPreCheck, setShowFitnessPreCheck] = React.useState(assessment.id === 'fitness');

    const handleAnswer = (questionIndex: number, value: number) => {
        setAnswers(prevAnswers => ({ ...prevAnswers, [questionIndex]: value }));
    };

    const handlePreCheck = (doesExercise: boolean) => {
        if (doesExercise) {
            setShowFitnessPreCheck(false);
        } else {
            // Se non fa attività fisica, assegna un punteggio minimo (es. 20) e termina
            onComplete(20);
        }
    };

    React.useEffect(() => {
        // Se siamo nella fase di pre-check, non fare nulla
        if (showFitnessPreCheck) return;

        const allQuestionsAnswered = Object.keys(answers).length > 0 && Object.keys(answers).length === assessment.questions.length;
        if (allQuestionsAnswered) {
            const score = Object.values(answers).reduce((sum: number, value: number) => sum + value, 0);
            const timerId = setTimeout(() => onComplete(score, answers), 350);
            return () => clearTimeout(timerId);
        }
    }, [answers, assessment.questions.length, onComplete, showFitnessPreCheck]);

    React.useEffect(() => {
        if (showFitnessPreCheck) return;

        if (answers[currentQuestionIndex] !== undefined) {
            const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
            if (!isLastQuestion) {
                const timerId = setTimeout(() => {
                    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
                }, 300);
                return () => clearTimeout(timerId);
            }
        }
    }, [answers, currentQuestionIndex, assessment.questions.length, showFitnessPreCheck]);


    // Render Pre-Check Screen for Fitness
    if (showFitnessPreCheck) {
        return (
            <div className="p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="p-4 bg-sky-100 rounded-full inline-block mb-4">
                        <assessment.Icon className="w-12 h-12 text-sky-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Analisi Fitness</h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Prima di iniziare, una domanda veloce: <br/>
                        <strong>Pratichi regolarmente attività fisica?</strong>
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => handlePreCheck(true)}
                            className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors shadow-md"
                        >
                            Sì, mi alleno
                        </button>
                        <button 
                            onClick={() => handlePreCheck(false)}
                            className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
                        >
                            No, sono sedentario
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const allAnswered = Object.keys(answers).length === assessment.questions.length;

    if (allAnswered) {
        return (
            <div className="p-4 md:p-8 text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-700">Calcolo dei risultati...</h2>
            </div>
        );
    }
        
    const currentQuestion = assessment.questions[currentQuestionIndex];
    const progress = (currentQuestionIndex / assessment.questions.length) * 100;

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{assessment.title}</h2>
            <p className="text-slate-600 mb-6">Domanda {currentQuestionIndex + 1} di {assessment.questions.length}</p>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md animate-slide-in-up" key={currentQuestionIndex}>
                <h3 className="text-xl font-semibold text-slate-700 mb-6">{currentQuestion.text}</h3>
                <div className="space-y-3">
                    {currentQuestion.options.map((option, optionIndex) => (
                        <button
                            key={optionIndex}
                            onClick={() => handleAnswer(currentQuestionIndex, option.value)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-slate-700 ${
                                answers[currentQuestionIndex] === option.value
                                ? 'bg-sky-100 border-sky-500 font-semibold ring-2 ring-sky-300'
                                : 'bg-slate-50 border-slate-200 hover:bg-sky-50 hover:border-sky-400'
                            }`}
                        >
                            {option.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizScreen;
