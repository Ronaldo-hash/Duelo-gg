import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';

export const NotificationToast: React.FC = () => {
    const { notification } = useAppStore();

    if (!notification) return null;

    const bgColors = {
        success: 'bg-emerald-500/90 border-emerald-500',
        error: 'bg-red-500/90 border-red-500',
        info: 'bg-[#0F1523]/90 border-white/10',
        warning: 'bg-amber-500/90 border-amber-500'
    };

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] animate-fade-in-down w-[90%] max-w-sm">
            <div className={`${bgColors[notification.type]} backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4`}>
                <span className="text-xl">{icons[notification.type]}</span>
                <p className="font-bold text-sm tracking-wide">{notification.message}</p>
            </div>
        </div>
    );
};
