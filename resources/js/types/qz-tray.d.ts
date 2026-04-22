declare module 'qz-tray' {
    export namespace websocket {
        function connect(host?: string): Promise<void>;
        function disconnect(): Promise<void>;
        function isActive(): boolean;
    }
    export namespace configs {
        function create(printerName: string, options?: any): any;
    }
    export namespace printers {
        function find(): Promise<string[]>;
    }
    export namespace security {
        function setCertificatePromise(promise: (resolve: (cert: string) => void, reject: (err: any) => void) => void): void;
        function setSignaturePromise(promise: (toSign: string) => (resolve: (sig: string) => void, reject: (err: any) => void) => void): void;
    }
    function print(config: any, data: any[]): Promise<void>;
}
