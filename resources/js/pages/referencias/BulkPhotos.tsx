import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectField } from '@/components/ui/form/SelectField';
import AppLayout from '@/layouts/app-layout';
import { showAlert } from '@/plugins/sweetalert';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, CheckCircle, FileUp, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel principal', href: route('dashboard') },
    { title: 'Referencias', href: route('referencias.index') },
    { title: 'Carga masiva de fotos', href: '#' },
];

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por chunk

export default function BulkPhotos({ cuentas }: { cuentas: any[] }) {
    const [selectedCuenta, setSelectedCuenta] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [results, setResults] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
            setProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!selectedCuenta) {
            showAlert('error', 'Por favor selecciona una cuenta');
            return;
        }
        if (!file) {
            showAlert('error', 'Por favor selecciona un archivo ZIP');
            return;
        }

        setLoading(true);
        setResults(null);
        setProgress(0);

        const uploadId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        try {
            // 1. Subir por Chunks
            for (let i = 0; i < totalChunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(file.size, start + CHUNK_SIZE);
                const chunk = file.slice(start, end);

                setStatusText(`Subiendo parte ${i + 1} de ${totalChunks}...`);
                const formData = new FormData();
                formData.append('file', chunk);
                formData.append('uploadId', uploadId);
                formData.append('chunkIndex', i.toString());
                formData.append('totalChunks', totalChunks.toString());

                await axios.post(route('api.referencias.bulk-photos.chunk'), formData);
                setProgress(Math.round(((i + 1) / totalChunks) * 100));
            }

            // 2. Procesar ZIP
            setStatusText('Extrayendo y vinculando fotos (esto puede tardar)...');
            const response = await axios.post(route('api.referencias.bulk-photos.process'), {
                cuenta_id: selectedCuenta,
                uploadId: uploadId
            });

            setResults(response.data);
            showAlert('success', 'Proceso completado');
        } catch (error: any) {
            console.error('Error uploading photos:', error);
            showAlert('error', error.response?.data?.error || 'Error al cargar las fotos');
        } finally {
            setLoading(false);
            setStatusText('');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Carga masiva de fotos" />

            <div className="space-y-6 p-4">
                <div className="flex items-center gap-4">
                    <Link href={route('referencias.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <PageHeader
                        title="Carga masiva de fotos"
                        description="Sube un archivo ZIP con las fotos de las referencias. El nombre de cada archivo debe ser el código de la referencia."
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de carga</CardTitle>
                            <CardDescription>
                                Selecciona la cuenta y el archivo ZIP que deseas procesar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SelectField
                                name="cuenta_id"
                                title="Cuenta / Empresa"
                                placeholder="Selecciona una cuenta"
                                value={selectedCuenta}
                                onChange={(val) => setSelectedCuenta(val as string)}
                                lista={cuentas}
                                item={{ idx: 'id', value: 'nombre' }}
                                error={undefined}
                                required
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Archivo ZIP (.zip)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="zip-upload"
                                    />
                                    <label
                                        htmlFor="zip-upload"
                                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    >
                                        <FileUp className="mr-2 h-4 w-4 text-slate-500" />
                                        {file ? file.name : 'Seleccionar archivo ZIP'}
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tamaño máximo: 50MB. Formatos soportados dentro del ZIP: JPG, JPEG, PNG, WEBP.
                                </p>
                            </div>

                            {loading && (
                                <div className="space-y-2">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-center text-xs font-medium text-slate-500">{statusText}</p>
                                </div>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleUpload}
                                disabled={loading || !selectedCuenta || !file}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Iniciar carga e importación'
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {results && (
                        <Card className="border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-950/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    Resultados del proceso
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900">
                                        <div className="text-2xl font-bold">{results.total}</div>
                                        <div className="text-xs text-muted-foreground">Archivos en ZIP</div>
                                    </div>
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-900/50 dark:bg-green-900/20">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{results.updated}</div>
                                        <div className="text-xs text-green-600/70 dark:text-green-400/70">Fotos actualizadas</div>
                                    </div>
                                </div>

                                {results.skipped?.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <XCircle className="h-4 w-4 text-orange-500" />
                                            Omitidos ({results.skipped.length})
                                        </div>
                                        <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-900">
                                            <ul className="space-y-1">
                                                {results.skipped.map((s: string, i: number) => (
                                                    <li key={i} className="text-slate-500">• {s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {results.errors?.length > 0 && (
                                    <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                                        <div className="mb-2 text-sm font-semibold text-red-600">Errores</div>
                                        <div className="max-h-40 overflow-y-auto rounded-md border border-red-200 bg-white p-2 text-xs text-red-500 dark:border-red-900/50 dark:bg-slate-900">
                                            {results.errors.map((e: string, i: number) => (
                                                <div key={i}>• {e}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
