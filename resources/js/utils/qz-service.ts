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

export const connectQZ = async () => {
    setupSecurity();
    if (connected) return;
    try {
        await qz.websocket.connect();
        connected = true;
        console.log('QZ Tray connected (with security)');

        // List available printers
        const printers = await qz.printers.find();
        console.log('--- Impresoras Disponibles (Copia el nombre exacto) ---');
        console.log(printers);
        console.log('---------------------------');
    } catch (err) {
        console.error('Error connecting to QZ Tray', err);
        throw err;
    }
};

export const disconnectQZ = async () => {
    if (!connected) return;
    try {
        await qz.websocket.disconnect();
        connected = false;
        console.log('QZ Tray disconnected');
    } catch (err) {
        console.error('Error disconnecting from QZ Tray', err);
    }
};

export const printWithQZ = async (printerName: string, htmlContent: string) => {
    try {
        await connectQZ();
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
        console.error('Error printing with QZ Tray', err);
        throw err;
    }
};
