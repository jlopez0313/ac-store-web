import { SelectField } from '@/components/ui/form/SelectField';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

const CHUNK_SIZE = 3 * 1024 * 1024;

const PASOS_MAESTROS = [
    { key: 'categorias', label: 'Categorías', icon: '📐' },
    { key: 'marcas', label: 'Marcas', icon: '🏷️' },
    { key: 'users_locales', label: 'Locales/Clientes', icon: '👤' },
    { key: 'proveedores', label: 'Proveedores', icon: '🤝' },
    { key: 'bodegas', label: 'Bodegas', icon: '🏭' },
    { key: 'referencias', label: 'Referencias', icon: '👟' },
];

const PASO_INVENTARIO = { key: 'inventario', label: 'Inventario', icon: '📦' };

const PASOS_TRANSACCIONES = [
    { key: 'traslados', label: 'Traslados', icon: '🔄' },
    { key: 'compras', label: 'Compras', icon: '🛒' },
    { key: 'ventas', label: 'Ventas', icon: '💰' },
    { key: 'muestras', label: 'Muestras', icon: '👟' },
];

interface ProgresoData {
    paso: string;
    pct: number;
    mensaje: string;
    dry_run?: boolean;
    logs: string[];
}

export default function ImportarSistemaViejo({ cuentas }: { cuentas: any[] }) {
    const [cuentaId, setCuentaId] = useState('');
    const [dryRun, setDryRun] = useState(true);

    // Section toggles
    const [secMaestros, setSecMaestros] = useState(true);
    const [secInventario, setSecInventario] = useState(true);
    const [secTransacciones, setSecTransacciones] = useState(true);

    // Inventario: importar desde referencia
    const [refDesde, setRefDesde] = useState('');

    // Excel state
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [excelDragOver, setExcelDragOver] = useState(false);
    const [excelUploadPct, setExcelUploadPct] = useState(0);
    const [excelUploadDone, setExcelUploadDone] = useState(false);
    const [uploading, setUploading] = useState(false);

    // CSV state
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvDragOver, setCsvDragOver] = useState(false);
    const [csvUploadPct, setCsvUploadPct] = useState(0);
    const [csvUploadDone, setCsvUploadDone] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);

    // Shared upload ID
    const [uploadId, setUploadId] = useState<string | null>(null);

    // Job state
    const [jobKey, setJobKey] = useState<string | null>(null);
    const [progreso, setProgreso] = useState<ProgresoData | null>(null);
    const [pollingActive, setPollingActive] = useState(false);

    const excelRef = useRef<HTMLInputElement>(null);
    const csvRef = useRef<HTMLInputElement>(null);
    const pollingRef = useRef<any>(null);

    const generarUploadId = () => {
        if (uploadId) return uploadId;
        const uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setUploadId(uid);
        return uid;
    };

    // ─── Polling de progreso ───
    useEffect(() => {
        if (!pollingActive || !jobKey) return;

        pollingRef.current = setInterval(async () => {
            try {
                const { data } = await axios.get(route('importar.progreso'), { params: { jobKey } });
                setProgreso(data);

                if (['completado', 'error'].includes(data.paso)) {
                    setPollingActive(false);
                    clearInterval(pollingRef.current);
                }
            } catch (e) {
                console.error('Error polling:', e);
            }
        }, 2000);

        return () => clearInterval(pollingRef.current);
    }, [pollingActive, jobKey]);

    // ─── Excel handlers ───
    const handleExcelDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setExcelDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.name.endsWith('.xlsx')) {
            setExcelFile(f);
            setExcelUploadDone(false);
            setExcelUploadPct(0);
        }
    }, []);

    const handleExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setExcelFile(f);
            setExcelUploadDone(false);
            setExcelUploadPct(0);
        }
    };

    // ─── CSV handlers ───
    const handleCsvDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setCsvDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f?.name.endsWith('.csv')) {
            setCsvFile(f);
            setCsvUploadDone(false);
            setCsvUploadPct(0);
        }
    }, []);

    const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setCsvFile(f);
            setCsvUploadDone(false);
            setCsvUploadPct(0);
        }
    };

    // ─── Subir CSV inventario (chunked) ───
    const subirCsv = async (uid: string) => {
        if (!csvFile || csvUploadDone) return;
        setCsvUploading(true);
        try {
            const total = Math.ceil(csvFile.size / CHUNK_SIZE);
            let uploaded = 0;

            for (let i = 0; i < total; i++) {
                const blob = csvFile.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const form = new FormData();
                form.append('file', blob);
                form.append('uploadId', uid);
                form.append('chunkIndex', i.toString());
                form.append('totalChunks', total.toString());

                await axios.post(route('importar.chunkCsv'), form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                uploaded++;
                const pct = Math.round((uploaded / total) * 100);
                setCsvUploadPct(pct);
                setProgreso((prev) => (prev ? { ...prev, mensaje: `Subiendo CSV: ${pct}%` } : null));
            }
            setCsvUploadDone(true);
        } finally {
            setCsvUploading(false);
        }
    };

    // ─── Procedimiento de Importación ───
    const iniciarProceso = async () => {
        if (!cuentaId) return alert('Selecciona una cuenta');
        if (necesitaExcel && !excelFile) return alert('Selecciona el archivo Excel');
        if (!secMaestros && !secInventario && !secTransacciones) return alert('Selecciona al menos una sección');

        setUploading(true);
        setProgreso({ paso: 'subiendo', pct: 0, mensaje: 'Subiendo archivos...', logs: [] });

        try {
            const uid = generarUploadId();

            // 1. Subir Excel en chunks si se necesita y no se ha subido
            if (necesitaExcel && excelFile && !excelUploadDone) {
                const total = Math.ceil(excelFile.size / CHUNK_SIZE);
                let uploaded = 0;

                for (let i = 0; i < total; i++) {
                    const blob = excelFile.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    const form = new FormData();
                    form.append('file', blob);
                    form.append('uploadId', uid);
                    form.append('chunkIndex', i.toString());
                    form.append('totalChunks', total.toString());

                    await axios.post(route('importar.chunk'), form, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    uploaded++;
                    const pct = Math.round((uploaded / total) * 100);
                    setExcelUploadPct(pct);
                    setProgreso((prev) => (prev ? { ...prev, pct, mensaje: `Subiendo Excel: ${pct}%` } : null));
                }
                setExcelUploadDone(true);
            }

            // 2. Subir CSV de inventario si existe
            if (secInventario && csvFile && !csvUploadDone) {
                setProgreso((prev) => (prev ? { ...prev, mensaje: 'Subiendo CSV inventario...' } : null));
                await subirCsv(uid);
            }

            // 3. Construir parámetro solo (comma-separated steps de secciones activas)
            let soloParam = '';
            if (!secMaestros || !secInventario || !secTransacciones) {
                const steps: string[] = [];
                if (secMaestros) steps.push(...PASOS_MAESTROS.map((p) => p.key));
                if (secInventario) steps.push(PASO_INVENTARIO.key);
                if (secTransacciones) steps.push(...PASOS_TRANSACCIONES.map((p) => p.key));
                soloParam = steps.join(',');
            }

            // 4. Ejecutar Job
            setProgreso({ paso: 'encolado', pct: 0, mensaje: 'Encolando job...', logs: [] });

            const { data } = await axios.post(route('importar.ejecutar'), {
                uploadId: uid,
                cuenta_id: cuentaId,
                dry_run: dryRun,
                solo: soloParam || undefined,
                ref_desde: refDesde || undefined,
            });

            setJobKey(data.jobKey);
            setPollingActive(true);
        } catch (error: any) {
            console.error('Error en el proceso:', error);
            alert(error.response?.data?.error || 'Error al procesar la solicitud.');
            setProgreso({ paso: 'error', pct: 0, mensaje: 'Proceso detenido por error.', logs: [error.message] });
        } finally {
            setUploading(false);
        }
    };

    const estaActivo = !!(progreso && !['completado', 'error', 'no_encontrado'].includes(progreso?.paso));

    // Derived: which files are needed based on active sections
    const necesitaExcel = secMaestros || secTransacciones;
    const _algunaSeccion = secMaestros || secInventario || secTransacciones;
    const estaListo = !!(cuentaId && _algunaSeccion && (!necesitaExcel || excelFile));

    return (
        <AppLayout>
            <Head title="Importar Sistema Viejo" />
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importación de datos</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Migra los datos del sistema viejo (Access/Excel) al sistema nuevo. El Excel contiene datos maestros y transacciones; el
                        inventario se carga desde CSV.
                    </p>
                </div>

                {/* Configuración global */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <SelectField
                            name="cuenta_id"
                            title="Cuenta destino"
                            required
                            value={cuentaId}
                            onChange={(val) => setCuentaId(val as string)}
                            disabled={estaActivo}
                            lista={cuentas}
                            item={{ idx: 'id', value: 'nombre' }}
                            error={''}
                        />
                    </div>

                    <div className="flex items-end gap-6 pb-1">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="checkbox"
                                checked={dryRun}
                                onChange={(e) => setDryRun(e.target.checked)}
                                disabled={estaActivo}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                <strong>Simulación</strong>
                            </span>
                        </label>
                    </div>
                </div>

                {/* ─── 3 secciones de archivos ─── */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Sección 1: Datos maestros (Excel) */}
                    <div
                        className={`space-y-3 rounded-xl border p-4 transition-opacity ${secMaestros ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 opacity-40 dark:border-gray-800'}`}
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={secMaestros}
                                onChange={(e) => setSecMaestros(e.target.checked)}
                                disabled={estaActivo}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">1. Datos maestros</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Excel con categorías, marcas, proveedores, bodegas y referencias
                                </p>
                            </div>
                        </div>

                        <div
                            onClick={() => necesitaExcel && !uploading && !excelUploadDone && excelRef.current?.click()}
                            onDrop={necesitaExcel ? handleExcelDrop : undefined}
                            onDragOver={
                                necesitaExcel
                                    ? (e) => {
                                          e.preventDefault();
                                          setExcelDragOver(true);
                                      }
                                    : undefined
                            }
                            onDragLeave={necesitaExcel ? () => setExcelDragOver(false) : undefined}
                            className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                                !necesitaExcel
                                    ? 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800'
                                    : excelDragOver
                                      ? 'cursor-pointer border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                                      : excelUploadDone
                                        ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                                        : excelFile
                                          ? 'cursor-pointer border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                                          : 'cursor-pointer border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
                            }`}
                        >
                            <input ref={excelRef} type="file" accept=".xlsx" className="hidden" onChange={handleExcelFile} />

                            {!necesitaExcel ? (
                                <>
                                    <div className="mb-1 text-xl opacity-40">📂</div>
                                    <p className="text-xs text-gray-400">No se necesita Excel para esta selección</p>
                                </>
                            ) : excelUploadDone ? (
                                <>
                                    <div className="mb-1 text-xl">✅</div>
                                    <p className="text-xs font-medium text-green-700">{excelFile!.name}</p>
                                    <p className="text-xs text-green-600">{(excelFile!.size / 1024 / 1024).toFixed(1)} MB</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExcelFile(null);
                                            setExcelUploadDone(false);
                                            setExcelUploadPct(0);
                                        }}
                                        className="mt-1 text-xs text-red-500 hover:underline"
                                    >
                                        Cambiar
                                    </button>
                                </>
                            ) : excelFile ? (
                                <>
                                    <div className="mb-1 text-xl">📂</div>
                                    <p className="text-xs font-medium text-amber-700">{excelFile.name}</p>
                                    <p className="text-xs text-amber-600">{(excelFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                    {uploading && (
                                        <div className="mt-2">
                                            <div className="h-1.5 w-full rounded-full bg-gray-200">
                                                <div
                                                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                                                    style={{ width: `${excelUploadPct}%` }}
                                                />
                                            </div>
                                            <p className="mt-0.5 text-xs text-gray-500">{excelUploadPct}%</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="mb-1 text-2xl">📂</div>
                                    <p className="text-xs text-gray-600">
                                        Arrastra o <span className="font-medium text-blue-600">busca</span>
                                    </p>
                                    <p className="text-xs text-gray-400">.xlsx</p>
                                </>
                            )}
                        </div>

                        {/* Lista de pasos maestros */}
                        <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                            {PASOS_MAESTROS.map((p, i) => (
                                <PasoRow key={p.key} paso={p} index={i} disabled={!secMaestros} progreso={progreso} />
                            ))}
                        </div>
                    </div>

                    {/* Sección 2: Inventario (CSV) */}
                    <div
                        className={`space-y-3 rounded-xl border p-4 transition-opacity ${secInventario ? 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20' : 'border-gray-100 opacity-40 dark:border-gray-800'}`}
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={secInventario}
                                onChange={(e) => setSecInventario(e.target.checked)}
                                disabled={estaActivo}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">2. Inventario</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">CSV con los movimientos de inventario (~200k filas)</p>
                            </div>
                        </div>

                        <div
                            onClick={() => secInventario && !csvUploading && !csvUploadDone && csvRef.current?.click()}
                            onDrop={secInventario ? handleCsvDrop : undefined}
                            onDragOver={
                                secInventario
                                    ? (e) => {
                                          e.preventDefault();
                                          setCsvDragOver(true);
                                      }
                                    : undefined
                            }
                            onDragLeave={secInventario ? () => setCsvDragOver(false) : undefined}
                            className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                                !secInventario
                                    ? 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800'
                                    : csvDragOver
                                      ? 'cursor-pointer border-blue-400 bg-blue-50 dark:bg-blue-950/30'
                                      : csvUploadDone
                                        ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                                        : csvFile
                                          ? 'cursor-pointer border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                                          : 'cursor-pointer border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
                            }`}
                        >
                            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />

                            {csvUploadDone ? (
                                <>
                                    <div className="mb-1 text-xl">✅</div>
                                    <p className="text-xs font-medium text-green-700">{csvFile!.name}</p>
                                    <p className="text-xs text-green-600">{(csvFile!.size / 1024 / 1024).toFixed(1)} MB</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCsvFile(null);
                                            setCsvUploadDone(false);
                                            setCsvUploadPct(0);
                                        }}
                                        className="mt-1 text-xs text-red-500 hover:underline"
                                    >
                                        Cambiar
                                    </button>
                                </>
                            ) : csvFile ? (
                                <>
                                    <div className="mb-1 text-xl">📄</div>
                                    <p className="text-xs font-medium text-amber-700">{csvFile.name}</p>
                                    <p className="text-xs text-amber-600">{(csvFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                    {csvUploading && (
                                        <div className="mt-2">
                                            <div className="h-1.5 w-full rounded-full bg-gray-200">
                                                <div
                                                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                                                    style={{ width: `${csvUploadPct}%` }}
                                                />
                                            </div>
                                            <p className="mt-0.5 text-xs text-gray-500">{csvUploadPct}%</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="mb-1 text-2xl">📄</div>
                                    <p className="text-xs text-gray-600">
                                        Arrastra o <span className="font-medium text-blue-600">busca</span>
                                    </p>
                                    <p className="text-xs text-gray-400">.csv</p>
                                </>
                            )}
                        </div>

                        {secInventario && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium whitespace-nowrap text-gray-600 dark:text-gray-400">Desde ref:</label>
                                <input
                                    type="text"
                                    value={refDesde}
                                    onChange={(e) => setRefDesde(e.target.value)}
                                    disabled={estaActivo}
                                    placeholder="Ej: 496 (vacío = todas)"
                                    className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                                />
                            </div>
                        )}

                        <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                            <PasoRow paso={PASO_INVENTARIO} index={6} disabled={!secInventario} progreso={progreso} />
                        </div>

                        {secInventario && !csvFile && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/30">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    Si no subes CSV, el inventario se generará desde el Excel (más lento).
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sección 3: Transacciones (Excel) */}
                    <div
                        className={`space-y-3 rounded-xl border p-4 transition-opacity ${secTransacciones ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 opacity-40 dark:border-gray-800'}`}
                    >
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={secTransacciones}
                                onChange={(e) => setSecTransacciones(e.target.checked)}
                                disabled={estaActivo}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                            />
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">3. Transacciones</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Traslados, compras, ventas y muestras del mismo Excel</p>
                            </div>
                        </div>

                        <div className="rounded-lg border-2 border-dashed bg-gray-50 p-4 text-center dark:border-gray-600 dark:bg-gray-800">
                            {excelFile ? (
                                <>
                                    <div className="mb-1 text-xl">📂</div>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Usa el mismo Excel</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{excelFile.name}</p>
                                </>
                            ) : (
                                <>
                                    <div className="mb-1 text-xl opacity-40">📂</div>
                                    <p className="text-xs text-gray-400">Primero sube el Excel en la sección 1</p>
                                </>
                            )}
                        </div>

                        <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                            {PASOS_TRANSACCIONES.map((p, i) => (
                                <PasoRow key={p.key} paso={p} index={7 + i} disabled={!secTransacciones} progreso={progreso} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── Botón y progreso ─── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-3">
                        <button
                            onClick={iniciarProceso}
                            disabled={!estaListo || estaActivo || uploading}
                            className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
                                !estaListo || estaActivo || uploading
                                    ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                    : dryRun
                                      ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                                      : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                            }`}
                        >
                            {uploading
                                ? '⬆ Subiendo archivos...'
                                : estaActivo
                                  ? '⏳ Procesando en background...'
                                  : dryRun
                                    ? '🔍 Simular importación'
                                    : '🚀 Ejecutar importación'}
                        </button>

                        {dryRun && !estaActivo && (
                            <p className="text-center text-xs text-amber-600">⚠ Modo simulación activo. Desmarca para importar de verdad.</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Barra de progreso global */}
                        {progreso && (
                            <div
                                className={`space-y-3 rounded-lg border p-4 ${
                                    progreso.paso === 'error'
                                        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                                        : progreso.paso === 'completado'
                                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                                          : progreso.dry_run
                                            ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                                            : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {progreso.paso === 'error'
                                            ? '❌ Error'
                                            : progreso.paso === 'completado'
                                              ? progreso.dry_run
                                                  ? '🔍 Simulación completada'
                                                  : '✅ Completado'
                                              : progreso.paso === 'encolado'
                                                ? '⏳ En cola...'
                                                : `⚙ ${progreso.paso}`}
                                    </span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{progreso.pct}%</span>
                                </div>

                                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                            progreso.paso === 'error' ? 'bg-red-500' : progreso.paso === 'completado' ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${progreso.pct}%` }}
                                    />
                                </div>

                                <p className="text-xs text-gray-600 dark:text-gray-400">{progreso.mensaje}</p>
                            </div>
                        )}

                        {/* Logs */}
                        {progreso?.logs && progreso.logs.length > 0 && (
                            <div>
                                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Logs del job:</p>
                                <div className="max-h-52 overflow-y-auto rounded-lg bg-gray-900 p-3 dark:bg-black">
                                    {progreso.logs.map((l, i) => (
                                        <p
                                            key={i}
                                            className={`font-mono text-xs whitespace-pre-wrap ${l.includes('Error') || l.includes('error') ? 'text-red-400' : 'text-green-400'}`}
                                        >
                                            {l}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PasoRow({
    paso,
    index,
    disabled,
    progreso,
}: {
    paso: { key: string; label: string; icon: string };
    index: number;
    disabled: boolean;
    progreso: ProgresoData | null;
}) {
    const esActual = progreso?.paso === paso.key;
    const enLog = progreso?.logs?.some((l) => l.includes(paso.label.toUpperCase()) || l.includes(paso.key.toUpperCase()));

    return (
        <div
            className={`flex items-center gap-3 px-3 py-2 transition-colors ${esActual ? 'bg-blue-50 dark:bg-blue-950/30' : disabled ? 'bg-gray-50 opacity-40 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}
        >
            <span className="w-5 text-center text-base">{paso.icon}</span>
            <span className="flex-1 text-xs text-gray-800 dark:text-gray-200">{paso.label}</span>
            {disabled ? (
                <span className="text-xs text-gray-400 dark:text-gray-500">omitido</span>
            ) : esActual ? (
                <Spinner />
            ) : enLog ? (
                <span className="text-xs font-medium text-green-600">✓</span>
            ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">{index + 1}</span>
            )}
        </div>
    );
}

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}
