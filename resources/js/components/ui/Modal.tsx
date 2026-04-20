import { cn } from "@/lib/utils";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Fragment } from "react";

const MaxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
    "6xl": "sm:max-w-6xl",
    "7xl": "sm:max-w-7xl",
}

type Props = {
    title: string;
    children: any;
    show: boolean;
    closeable: boolean;
    subtitle?: string;
    maxWidth?: string;
    className?: string;
    onClose?: () => void;
}

export const Modal = ({
    title,
    subtitle,
    children,
    show = false,
    maxWidth = "2xl",
    closeable = true,
    className = '',
    onClose = () => { },
}: Props) => {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = MaxWidthClass[maxWidth as keyof typeof MaxWidthClass] ?? MaxWidthClass['2xl'];

    return (
        <Transition show={show} as={Fragment} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex overflow-y-auto px-4 py-6 sm:px-2 items-center transform transition-all"
                onClose={close}
            >
                {/* Overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" />
                </Transition.Child>

                {/* Contenido */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <Dialog.Panel
                        className={cn(
                            'relative z-50',
                            'mb-6 bg-background rounded-lg overflow-hidden shadow-xl transform transition-all w-full sm:mx-auto border border-border',
                            'max-h-[90vh] overflow-y-auto',
                            maxWidthClass,
                            className
                        )}
                    >
                        {closeable && (
                            <button
                                type="button"
                                onClick={close}
                                className="absolute top-4 right-4 z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <Dialog.Title className="text-lg font-medium leading-6 text-foreground max-w-7xl sm:px-6 lg:px-8 px-3 mt-6 pr-10">
                            {title}
                        </Dialog.Title>
                        <Dialog.Description className="text-sm leading-6 text-muted-foreground max-w-7xl sm:px-6 lg:px-8 px-3 mt-1">
                            {subtitle}
                        </Dialog.Description>
                        {children}
                    </Dialog.Panel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
};
