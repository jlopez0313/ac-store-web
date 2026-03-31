import InputError from '@/components/input-error';
import { TextareaHTMLAttributes } from 'react';
import { Label } from '../label';
import { Textarea } from '../textarea';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    rows: number;
    name: string;
    title: string;
    value?: string;
    required?: boolean;
    error?: string | undefined;
    placeholder?: string;
    onChange?: (e: string) => void;
}

export const TextAreaField = ({ 
    rows,
    name,
    title,
    value = '',
    required = false,
    placeholder,
    error = '',
    onChange = () => {},
}: Props) => {
    return (
        <div>
            <Label htmlFor={name}> {title}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <Textarea
                rows={rows}
                required={required}
                placeholder={placeholder ?? title}
                id={name}
                name={name}
                value={value}
                className="mt-1 block w-full"
                autoComplete={name}
                onChange={(e) => onChange(e.target.value)}
            />

            <InputError message={error} className="mt-2" />
        </div>
    )
}
