import * as qz from 'qz-tray';

let connected = false;

export const connectQZ = async () => {
    if (connected) return;
    try {
        await qz.websocket.connect();
        connected = true;
        console.log('QZ Tray connected');

        // List available printers
        const printers = await qz.printers.find();
        console.log('--- Available Printers ---');
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
