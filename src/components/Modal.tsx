import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={handleBackdropClick}>
            <div className="relative w-full max-w-2xl my-8 animate-slide-up-fade-in bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
                {title && (
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-t-2xl">
                        <h3 className="text-xl font-heading font-bold text-slate-800 dark:text-white">{title}</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            ✕
                        </button>
                    </div>
                )}
                <div className={title ? "" : "p-0"}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;