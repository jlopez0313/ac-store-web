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

let connectionPromise: Promise<boolean> | null = null;

export const connectQZ = async (): Promise<boolean> => {
    setupSecurity();

    // If qz is already active (ready to send data), we can return true
    if (qz.websocket.isActive()) {
        try {
            // Test if it's really active by checking one property if accessible
            // or just rely on the fact that if it's been through our connectionPromise, it's ready.
            if (connected) return true;
        } catch (e) {
            // Fall through to reconnect
        }
    }

    if (connectionPromise) {
        try {
            await connectionPromise;
            return true;
        } catch (err) {
            // If failed, continue to attempt a new connection
            connectionPromise = null;
        }
    }

    connectionPromise = (async () => {
        try {
            // Using qz.websocket.connect() directly
            // Note: connect() rejects if already connecting, so the connectionPromise 
            // guard above is important.
            await qz.websocket.connect();
            connected = true;
            console.log('QZ Tray connected');
            
            // Optional: log printers to verify connection is operational
            const printers = await qz.printers.find();
            console.log('Impresoras disponibles:', printers);
            
            return true;
        } catch (err: any) {
            connected = false;
            connectionPromise = null;
            
            // If it says "already exists", we consider it a success
            if (err?.message?.includes('already exists')) {
                connected = true;
                return true;
            }
            
            console.warn('QZ Tray connection failed:', err.message || err);
            return false;
        }
    })();

    return connectionPromise;
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
        const config = qz.configs.create(printerName, {
            size: { width: 3.15, height: 0 },  // 80mm = 3.15 inches; height 0 = auto
            units: 'in',
            margins: 0,
            scaleContent: false,
        });
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
