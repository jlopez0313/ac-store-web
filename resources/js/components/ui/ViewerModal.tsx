import { Dialog, DialogContent, DialogOverlay, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import * as React from 'react';

interface ViewerModalProps {
    show: boolean;
    image: string | null;
    onClose: () => void;
}

export const ViewerModal = ({ show, image, onClose }: ViewerModalProps) => {
    if (!image) return null;

    const src = image.startsWith('http') || image.startsWith('/') ? image : `/storage/${image}`;

    return (
        <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
            <DialogOverlay className="z-[200] bg-black/90 backdrop-blur-sm" />
            <DialogContent 
                className="z-[200] border-none bg-transparent p-0 shadow-none max-w-5xl w-[95vw] h-auto flex items-center justify-center focus:outline-none"
                hideCloseButton
            >
                <VisuallyHidden>
                    <DialogTitle>Vista previa de imagen</DialogTitle>
                </VisuallyHidden>
                
                <div className="relative w-full group">
                    <button
                        onClick={onClose}
                        className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    
                    <img
                        src={src}
                        alt="Full resolution"
                        className="h-auto max-h-[85vh] w-full rounded-lg object-contain shadow-2xl transition-transform"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
