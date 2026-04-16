import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';

const PASOS = [
    { key: 'marcas', label: 'Marcas', icon: '🏷️' },
    { key: 'proveedores', label: 'Proveedores', icon: '🤝' },
    { key: 'bodegas', label: 'Bodegas', icon: '🏭' },
    { key: 'referencias', label: 'Referencias', icon: '👟' },
    { key: 'inventario', label: 'Inventario', icon: '📦' },
    { key: 'compras', label: 'Compras', icon: '🛒' },
    { key: 'ventas', label: 'Ventas', icon: '💰' },
];

export default function ImportarSistemaViejo({ cuentas }: any) {
    const [cuentaId, setCuentaId] = useState('');
    const [archivo, setArchivo] = useState<any>(null);
    const [dryRun, setDryRun] = useState(true);
    const [soloStep, setSoloStep] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: any) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && f.name.endsWith('.xlsx')) setArchivo(f);
    }, []);

    const handleFile = (e: any) => {
        const f = e.target.files[0];
        if (f) setArchivo(f);
    };

    const handleSubmit = () => {
        if (!cuentaId) return alert('Selecciona una cuenta');
        if (!archivo) return alert('Sube el archivo Excel');

        setLoading(true);
        setResultado(null);

        const form = new FormData();
        form.append('cuenta_id', cuentaId);
        form.append('archivo', archivo);
        form.append('dry_run', dryRun ? '1' : '0');
        if (soloStep) form.append('solo', soloStep);

        router.post(route('importar.ejecutar'), form, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page: any) => {
                setResultado(page.props.resultado);
                setLoading(false);
            },
            onError: (errors: any) => {
                setResultado({ error: true, mensaje: Object.values(errors).join('\n') });
                setLoading(false);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Importar Sistema Viejo" />

            <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">

                {/* Header */}
                <div className="border-b border-gray-200 pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Importación de datos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Migra los datos del sistema viejo (Access/Excel) al sistema nuevo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* ─── Columna izquierda ─── */}
                    <div className="space-y-5">

                        {/* Cuenta */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cuenta destino <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={cuentaId}
                                onChange={e => setCuentaId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Seleccionar cuenta —</option>
                                {cuentas.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Archivo Excel */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Archivo Excel (.xlsx) <span className="text-red-500">*</span>
                            </label>
                            <div
                                onClick={() => fileRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e: any) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                className={`
                                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                    ${dragOver
                                        ? 'border-blue-400 bg-blue-50'
                                        : archivo
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
                                `}
                            >
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".xlsx"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                                {archivo ? (
                                    <div>
                                        <div className="text-2xl mb-1">✅</div>
                                        <p className="text-sm font-medium text-green-700">{archivo.name}</p>
                                        <p className="text-xs text-green-600 mt-0.5">
                                            {(archivo.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <button
                                            onClick={e => { e.stopPropagation(); setArchivo(null); }}
                                            className="mt-2 text-xs text-red-500 hover:underline"
                                        >
                                            Quitar archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-3xl mb-2">📂</div>
                                        <p className="text-sm text-gray-600">
                                            Arrastra el Excel aquí o{' '}
                                            <span className="text-blue-600 font-medium">haz clic para buscar</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Solo archivos .xlsx</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Opciones */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Opciones</label>

                            {/* Dry run */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={dryRun}
                                    onChange={e => setDryRun(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                    <strong>Simulación (dry-run)</strong> — recorre el archivo pero no
                                    inserta nada. Útil para verificar antes de importar de verdad.
                                </span>
                            </label>

                            {/* Solo un paso */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Importar solo una tabla (opcional):
                                </label>
                                <select
                                    value={soloStep}
                                    onChange={e => setSoloStep(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">— Todas las tablas en orden —</option>
                                    {PASOS.map(p => (
                                        <option key={p.key} value={p.key}>
                                            {p.icon} {p.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Botón */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !cuentaId || !archivo}
                            className={`
                                w-full py-3 rounded-lg font-semibold text-sm transition-all
                                ${loading || !cuentaId || !archivo
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : dryRun
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}
                            `}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Procesando...
                                </span>
                            ) : dryRun ? '🔍 Simular importación' : '🚀 Ejecutar importación'}
                        </button>

                        {dryRun && (
                            <p className="text-xs text-amber-600 text-center">
                                ⚠ Estás en modo simulación. Desmarca la casilla para importar de verdad.
                            </p>
                        )}
                    </div>

                    {/* ─── Columna derecha: orden de pasos ─── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Orden de importación
                        </label>
                        <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                            {PASOS.map((p, i) => {
                                const activo = !soloStep || soloStep === p.key;
                                const log = resultado?.pasos?.[p.key];
                                return (
                                    <div
                                        key={p.key}
                                        className={`flex items-center gap-3 px-4 py-3 transition-colors
                                            ${activo ? 'bg-white' : 'bg-gray-50 opacity-50'}`}
                                    >
                                        <span className="text-lg w-6 text-center">{p.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800">{p.label}</p>
                                            {log && (
                                                <p className="text-xs text-gray-500 truncate">{log}</p>
                                            )}
                                        </div>
                                        <StepBadge index={i} activo={activo} log={log} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── Resultado ─── */}
                {resultado && (
                    <div className={`rounded-lg border p-4 space-y-2 ${resultado.error
                        ? 'bg-red-50 border-red-200'
                        : resultado.dry_run
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-green-50 border-green-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {resultado.error ? '❌' : resultado.dry_run ? '🔍' : '✅'}
                            </span>
                            <p className="font-semibold text-sm">
                                {resultado.error
                                    ? 'Error en la importación'
                                    : resultado.dry_run
                                        ? 'Simulación completada'
                                        : 'Importación exitosa'}
                            </p>
                        </div>
                        {resultado.mensaje && (
                            <pre className="text-xs whitespace-pre-wrap text-gray-700 bg-white/60 rounded p-3 overflow-auto max-h-60">
                                {resultado.mensaje}
                            </pre>
                        )}
                        {resultado.resumen && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                {Object.entries(resultado.resumen).map(([k, v]) => (
                                    <div key={k} className="bg-white/70 rounded p-2 text-center">
                                        <p className="text-xs text-gray-500 capitalize">{k}</p>
                                        <p className="text-lg font-bold text-gray-800">{v as any}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function StepBadge({ index, activo, log }: any) {
    if (!activo) return <span className="text-xs text-gray-400">omitido</span>;
    if (log) {
        const isError = log.toLowerCase().includes('error');
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                }`}>
                {isError ? 'error' : 'ok'}
            </span>
        );
    }
    return (
        <span className="text-xs text-gray-400 w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
            {index + 1}
        </span>
    );
}
