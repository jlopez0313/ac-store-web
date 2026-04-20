import { initializeApp } from 'firebase/app';
import { getDatabase, onValue, push, ref, remove, type DatabaseReference } from 'firebase/database';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface PrintRequest {
    key?: string;
    venta_id: number;
    local_name: string;
    type: 'pendientes' | 'cuadre';
    created_at: number;
}

export function getPrintRequestsRef(cuentaId?: number | null): DatabaseReference {
    if (cuentaId) {
        return ref(database, `print_requests/${cuentaId}`);
    }
    return ref(database, 'print_requests');
}

export function createPrintRequest(cuentaId: number, data: Omit<PrintRequest, 'key' | 'created_at'>) {
    const listRef = getPrintRequestsRef(cuentaId);
    return push(listRef, {
        ...data,
        created_at: Date.now(),
    });
}

export function removePrintRequest(cuentaId: number, key: string) {
    const itemRef = ref(database, `print_requests/${cuentaId}/${key}`);
    return remove(itemRef);
}

export { onValue };

