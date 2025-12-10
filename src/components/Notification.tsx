import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { XIcon } from './icons/XIcon';

const Notification = ({ notification, onClose }) => {
    const [isFadingOut, setIsFadingOut] = React.useState(false);

    React.useEffect(() => {
        const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 3000); // Start fading out after 3 seconds

        return () => clearTimeout(fadeOutTimer);
    }, []);
    
    React.useEffect(() => {
        if (isFadingOut) {
            const closeTimer = setTimeout(onClose, 300); // Corresponds to animation duration
            return () => clearTimeout(closeTimer);
        }
    }, [isFadingOut, onClose]);

    const typeClasses = {
        success: {
            bg: 'bg-green-500',
            icon: <CheckCircleIcon className="w-6 h-6 text-white"/>
        },
        error: {
            bg: 'bg-red-500',
            icon: <XCircleIcon className="w-6 h-6 text-white"/>
        }
    };

    const currentType = typeClasses[notification.type] || typeClasses.success;

    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${currentType.bg} ${isFadingOut ? 'animate-toast-out' : 'animate-toast-in'}`}>
            <div className="mr-3">{currentType.icon}</div>
            <div className="font-semibold">{notification.message}</div>
            <button onClick={() => setIsFadingOut(true)} className="ml-4 -mr-2 p-1 rounded-full hover:bg-white/20 transition-colors">
                 <XIcon className="w-5 h-5"/>
            </button>
        </div>
    );
};

export default Notification;
