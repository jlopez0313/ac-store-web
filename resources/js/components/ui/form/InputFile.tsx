import InputError from '@/components/input-error';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../button';
import { Label } from '../label';

type FileData = {
    src: string;
    file?: File | null;
    mimetype: string;
};

type Props = {
    processing: boolean;
    accept: string;
    name: string;
    title: string;
    value?: { src: any; mimetype: string };
    required?: boolean;
    multiple?: boolean;
    error: string | undefined;
    placeholder?: string;
    onChange: (e: FileData) => void;
};

export const InputFile = ({
    processing,
    accept,
    name,
    title,
    value = { src: '', mimetype: '' },
    required = false,
    multiple = false,
    placeholder,
    error = '',
    onChange,
}: Props) => {

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<{ src: string; mimetype: string; file?: File | null } | null>(null);
    const [dragging, setDragging] = useState(false);

    const processFile = (file: File) => {
        const url = URL.createObjectURL(file);

        if (file.type.includes('image')) {
            setPreview({ src: url, mimetype: file.type, file });
        } else if (file.type.includes('video')) {
            setPreview({ src: url, mimetype: file.type, file });
        } else {
            setPreview({ src: file.name, mimetype: file.type, file });
        }

        onChange({ src: url, file: file, mimetype: file.type });
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
        onChange({ src: '', file: null, mimetype: '' });
    };

    const onInputChange = (e: any) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const showPreview = () => {
        if (!preview?.src || preview.src === '/') return null;

        if (preview?.mimetype?.includes('image'))
            return <img className="media preview" src={preview.src} alt="" />
        else if (preview?.mimetype?.includes('video'))
            return <video className="media preview" controls>
                <source src={preview.src}></source>
            </video>
        return <span className='text-xs font-bold'> Documento cargado: {preview?.mimetype} </span>
    };

    useEffect(() => {
        if (typeof value?.src == 'string' && value.src.length > 0) {
            setPreview({ src: '/' + value.src, mimetype: value.mimetype });
        } else if (value?.src instanceof File) {
            if (value.mimetype.includes('image')) {
                const url = URL.createObjectURL(value.src);
                setPreview({ src: url, mimetype: value.mimetype, file: value.src });
            } else {
                setPreview({ src: (value.src as File).name, mimetype: value.mimetype, file: value.src });
            }
        } else {
            setPreview(null);
        }
    }, [value]);

    return (
        <div>
            <Label htmlFor={name}>
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {/* Visually hidden but focusable input for validation */}
            <input
                ref={inputRef}
                type="file"
                className="absolute h-[1px] w-[1px] opacity-0 pointer-events-none"
                accept={accept}
                multiple={multiple}
                required={required && !value?.src}
                name={name}
                id={name}
                onChange={onInputChange}
            />

            {/* Drop zone */}
            <div
                onDragOver={e => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    mt-2 p-6 border-2 border-dashed rounded-lg cursor-pointer
                    text-center transition
                    ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                `}
            >
                <p className="text-sm text-gray-600">
                    Arrastra tu archivo aquí o <span className="text-blue-600 font-semibold">haz clic</span>
                </p>
            </div>

            <div className="mt-4 flex items-center gap-4">
                {preview?.mimetype ? (
                    <>
                        <div className="flex-1">
                            {showPreview()}
                        </div>
                        {!required && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearFile}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 text-xs"
                            >
                                <X className="h-4 w-4 mr-1" /> Remover
                            </Button>
                        )}
                    </>
                ) : null}
            </div>

            <InputError message={error} className="mt-2" />
        </div>
    );
};
