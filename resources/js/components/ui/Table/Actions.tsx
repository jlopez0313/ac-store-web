import { Download, FileCode, FileSpreadsheet, FileText, Printer } from "lucide-react";
import React, { useRef } from "react";
import { Button } from "../button";
import { cn } from "@/lib/utils";

type actions = 'csv' | 'excel' | 'pdf' | 'imprimir' | 'xml';

type Props = {
    action: string,
    actions: actions[],
    filtros?: any,
    children?: React.ReactNode,
    method?: 'get' | 'post',
    onAction?: (type: actions) => void;
}

export const Actions = ({ action, actions, filtros = {}, children, method = 'post', onAction }: Props) => {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const formRef = useRef<HTMLFormElement>(null);
    const fileTypeRef = useRef<HTMLInputElement>(null);

    const submitForm = (type: actions) => {
        if (onAction) {
            onAction(type);
            return;
        }

        if (method === 'get') {
            const params = new URLSearchParams(filtros);
            const url = `${action}/${type}?${params.toString()}`;
            window.open(url, '_blank');
            return;
        }

        if (!formRef.current || !fileTypeRef.current) return;

        fileTypeRef.current.value = type;
        formRef.current.target = (type === 'imprimir' || type === 'pdf') ? '_blank' : '_self';
        formRef.current.submit();
    };


    return (
        <form
            ref={formRef}
            method="post"
            action={action}
        >
            {/* CSRF */}
            <input type="hidden" name="_token" value={csrf ?? ''} />

            {/* Tipo de archivo dinámico */}
            <input ref={fileTypeRef} type="hidden" name="fileType" />

            {/* Filtros */}
            {Object.keys(filtros ?? {}).map((key) => (
                <input key={key} type="hidden" name={key} value={filtros[key]} />
            ))}

            <div className="flex gap-2">
                {children}

                {actions.map((action, idx) => {
                    const styles = {
                        csv: "border-slate-200 text-slate-600 hover:bg-slate-50",
                        excel: "border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300",
                        pdf: "border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300",
                        imprimir: "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300",
                        xml: "border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300",
                    };

                    const icons = {
                        csv: <Download className="w-4 h-4 mr-2" />,
                        excel: <FileSpreadsheet className="w-4 h-4 mr-2" />,
                        pdf: <FileText className="w-4 h-4 mr-2" />,
                        imprimir: <Printer className="w-4 h-4 mr-2" />,
                        xml: <FileCode className="w-4 h-4 mr-2" />,
                    };

                    return (
                        <Button
                            key={idx}
                            onClick={(e: any) => {
                                e.preventDefault();
                                submitForm(action);
                            }}
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 text-xs font-medium bg-white transition-colors capitalize",
                                styles[action]
                            )}
                            title={action.toUpperCase()}
                        >
                            {icons[action]}
                            {action}
                        </Button>
                    );
                })}
            </div>
        </form>
    );
};
