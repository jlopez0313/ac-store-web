import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ViewerModalProps {
    show: boolean;
    image: string | null;
    onClose: () => void;
}

export const ViewerModal = ({ show, image, onClose }: ViewerModalProps) => {
    useEffect(() => {
        if (!show) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [show, onClose]);

    if (!show || !image) return null;

    const src = image.startsWith('http') || image.startsWith('/') ? image : `/storage/${image}`;

    return createPortal(
        <div
            data-headlessui-portal=""
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
            <div
                className="relative w-full max-w-5xl p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-8 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                >
                    <X className="h-6 w-6" />
                </button>
                <img
                    src={src}
                    alt="Full resolution"
                    className="h-auto max-h-[85vh] w-full rounded-lg object-contain shadow-2xl"
                />
            </div>
        </div>,
        document.body,
    );
};
