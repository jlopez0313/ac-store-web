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
    function print(config: any, data: any[]): Promise<void>;
}
