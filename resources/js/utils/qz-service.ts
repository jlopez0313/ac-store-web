import axios from 'axios';
import * as qz from 'qz-tray';

let connected = false;
let securitySetup = false;

const setupSecurity = () => {
    if (securitySetup) return;

    qz.security.setCertificatePromise((resolve: (cert: string) => void, reject: (err: any) => void) => {
        axios
            .get('/api/qz/certificate')
            .then((response) => resolve(response.data))
            .catch(reject);
    });

    qz.security.setSignaturePromise((toSign: string) => {
        return (resolve: (sig: string) => void, reject: (err: any) => void) => {
            axios
                .post('/api/qz/sign', { request: toSign })
                .then((response) => resolve(response.data))
                .catch(reject);
        };
    });

    securitySetup = true;
};

let connectionPromise: Promise<void> | null = null;

export const connectQZ = async (): Promise<boolean> => {
    setupSecurity();

    if (qz.websocket.isActive()) {
        connected = true;
        return true;
    }

    if (connectionPromise) {
        try { await connectionPromise; return qz.websocket.isActive(); } catch { return false; }
    }

    connectionPromise = (async () => {
        try {
            await qz.websocket.connect();
            connected = true;
            console.log('QZ Tray connected');

            const printers = await qz.printers.find();
            console.log('Impresoras disponibles:', printers);
        } catch (err) {
            // QZ Tray no está disponible — no es un error crítico
            connected = false;
            connectionPromise = null;
            throw err;
        }
    })();

    try {
        await connectionPromise;
        return true;
    } catch {
        return false; // Silently return false when QZ is not reachable
    }
};

export const disconnectQZ = async () => {
    // Guard: only disconnect if the websocket is actually open
    if (!qz.websocket.isActive()) {
        connected = false;
        connectionPromise = null;
        return;
    }
    try {
        await qz.websocket.disconnect();
        connected = false;
        connectionPromise = null;
        console.log('QZ Tray disconnected');
    } catch (err) {
        // Ignore — connection may have already dropped
        connected = false;
        connectionPromise = null;
    }
};

export const printWithQZ = async (printerName: string, htmlContent: string) => {
    try {
        const isConnected = await connectQZ();
        if (!isConnected) {
            throw new Error('QZ Tray no está disponible. Verifique que la aplicación esté abierta y la impresora conectada.');
        }
        const config = qz.configs.create(printerName);
        const data = [
            {
                type: 'html',
                format: 'plain',
                data: htmlContent,
            },
        ];
        await qz.print(config, data);
    } catch (err) {
        console.error('Error de impresión QZ:', err);
        throw err;
    }
};
