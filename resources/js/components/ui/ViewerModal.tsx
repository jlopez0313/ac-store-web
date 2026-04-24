import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Fragment } from 'react';

interface ViewerModalProps {
    show: boolean;
    image: string | null;
    onClose: () => void;
}

export const ViewerModal = ({ show, image, onClose }: ViewerModalProps) => {
    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-5xl transform overflow-hidden transition-all">
                                <button
                                    onClick={onClose}
                                    className="absolute -top-12 right-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:top-0 sm:-right-12"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                                {image && (
                                    <img
                                        src={image.startsWith('http') ? image : `/storage/${image}`}
                                        alt="Full resolution"
                                        className="h-auto max-h-[85vh] w-full rounded-lg object-contain shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
