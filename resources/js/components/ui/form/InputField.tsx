import InputError from '@/components/input-error';
import { InputHTMLAttributes } from 'react';
import { Input } from '../input';
import { Label } from '../label';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    name: string;
    title: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    error?: string | undefined;
    onChange?: (e: string) => void;
}

export const InputField = ({ name,
    title,
    value = '',
    type = 'text',
    required = false,
    placeholder,
    error = '',
    onChange = () => {},
    ...props
}: Props) => {

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (type === 'number') {
            const forbiddenKeys = ['.', ',', 'e', 'E', '+', '-'];
            if (forbiddenKeys.includes(e.key)) {
                e.preventDefault();
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (type === 'number') {
            const pasteData = e.clipboardData.getData('text');
            const cleanData = pasteData.replace(/[.,eE+-]/g, '');
            if (cleanData !== pasteData) {
                e.preventDefault();
                onChange(cleanData);
            }
        }
    };

    return (
        <div>
            {title && (
                <Label htmlFor={name}> {title}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}

            <Input
                {...props}
                required={required}
                placeholder={placeholder ?? title}
                id={name}
                type={type}
                name={name}
                value={value}
                className="mt-1 block w-full"
                autoComplete={name}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onChange={(e) => {
                    if (type === 'number') {
                        const clean = e.target.value.replace(/[^0-9]/g, '');
                        onChange(clean);
                    } else {
                        onChange(e.target.value);
                    }
                }}
            />

            <InputError message={error ?? ''} className="mt-2" />
        </div>
    )
}
