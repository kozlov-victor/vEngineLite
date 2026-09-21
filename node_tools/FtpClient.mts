
import * as net from 'node:net';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

interface FtpClientOptions {
    host: string;
    port?: number;
    user: string;
    password: string;
    timeout?: number;
}

interface FtpEntry {
    name: string;
    directory: boolean;
    file: boolean;
}

interface FtpResponse {
    code: number;
    message: string;
}

interface FtpCommandResult<T = FtpResponse> {
    response: FtpResponse;
    data?: T;
}

export class FtpClient {

    private socket: net.Socket | null = null;
    private buffer = '';

    private socketError: Error | null = null;
    private socketClosed = false;

    /*
     * Усі FTP-команди проходять послідовно.
     *
     * Це важливо, оскільки FTP control connection
     * є одним послідовним потоком команд/відповідей.
     */
    private commandQueue: Promise<unknown> = Promise.resolve();

    private readonly options: FtpClientOptions;

    constructor(options: FtpClientOptions) {
        this.options = options;
    }

    public async connect(): Promise<void> {
        if (this.socket) {
            throw new Error('FTP client is already connected');
        }

        const socket = net.createConnection({
            host: this.options.host,
            port: this.options.port ?? 21
        });

        this.socket = socket;

        socket.setEncoding('utf8');

        socket.on('data', data => {
            this.buffer += data;
        });

        socket.on('error', error => {
            this.handleSocketError(error);
        });

        socket.on('close', () => {
            this.handleSocketClose();
        });

        await this.waitForSocketConnect(socket);

        const welcome = await this.readResponse();

        if (welcome.code !== 220) {
            throw new Error(
                `FTP connection failed: ${welcome.message}`
            );
        }

        const userResponse = await this.command(
            `USER ${this.options.user}`
        );

        if (
            userResponse.code !== 331 &&
            userResponse.code !== 230
        ) {
            throw new Error(
                `FTP USER failed: ${userResponse.message}`
            );
        }

        if (userResponse.code === 331) {
            const passwordResponse = await this.command(
                `PASS ${this.options.password}`,
                true
            );

            if (passwordResponse.code !== 230) {
                throw new Error(
                    `FTP authentication failed: ${passwordResponse.message}`
                );
            }
        }

        await this.command('TYPE I');
    }

    public async upload(
        localFile: string,
        remoteFile: string
    ): Promise<void> {

        const remoteDir = path.posix.dirname(remoteFile);

        if (remoteDir !== '.') {
            await this.ensureDirectory(remoteDir);
        }

        const dataSocket =
            await this.openPassiveConnection();

        try {
            const stream =
                fs.createReadStream(localFile);

            const result =
                await this.executeDataCommand(
                    dataSocket,
                    `STOR ${remoteFile}`,
                    async () => {
                        await new Promise<void>(
                            (resolve, reject) => {

                                let settled = false;

                                const fail = (
                                    error: Error
                                ) => {
                                    if (settled) {
                                        return;
                                    }

                                    settled = true;
                                    reject(error);
                                };

                                const complete = () => {
                                    if (settled) {
                                        return;
                                    }

                                    settled = true;
                                    resolve();
                                };

                                stream.once(
                                    'error',
                                    fail
                                );

                                dataSocket.once(
                                    'error',
                                    error => {
                                        fail(
                                            new Error(
                                                `FTP data socket error: ${error.message}`
                                            )
                                        );
                                    }
                                );

                                stream.pipe(
                                    dataSocket
                                );

                                dataSocket.once(
                                    'close',
                                    complete
                                );
                            }
                        );
                    }
                );

            if (
                result.code !== 226 &&
                result.code !== 250
            ) {
                throw new Error(
                    `FTP upload failed: ${result.message}`
                );
            }

        } finally {
            dataSocket.destroy();
        }
    }

    public async uploadDirectory(
        localDir: string,
        remoteDir = '/'
    ): Promise<void> {

        const entries =
            await fsp.readdir(
                localDir,
                {
                    withFileTypes: true
                }
            );

        await this.ensureDirectory(remoteDir);

        for (const entry of entries) {

            const localPath =
                path.join(
                    localDir,
                    entry.name
                );

            const remotePath =
                path.posix.join(
                    remoteDir,
                    entry.name
                );

            if (entry.isDirectory()) {

                await this.uploadDirectory(
                    localPath,
                    remotePath
                );

            } else if (entry.isFile()) {

                console.log(
                    `Uploading ${remotePath}`
                );

                await this.upload(
                    localPath,
                    remotePath
                );
            }
        }
    }

    public async list(
        remoteDir: string
    ): Promise<FtpEntry[]> {

        const dataSocket =
            await this.openPassiveConnection();

        try {

            let data = '';

            const response =
                await this.executeDataCommand(
                    dataSocket,
                    `MLSD ${remoteDir}`,
                    async () => {

                        dataSocket.setEncoding(
                            'utf8'
                        );

                        await new Promise<void>(
                            (resolve, reject) => {

                                let settled = false;

                                const fail = (
                                    error: Error
                                ) => {
                                    if (settled) {
                                        return;
                                    }

                                    settled = true;
                                    reject(error);
                                };

                                const complete = () => {
                                    if (settled) {
                                        return;
                                    }

                                    settled = true;
                                    resolve();
                                };

                                dataSocket.on(
                                    'data',
                                    chunk => {
                                        data += chunk;
                                    }
                                );

                                dataSocket.once(
                                    'error',
                                    error => {
                                        fail(
                                            new Error(
                                                `FTP data socket error: ${error.message}`
                                            )
                                        );
                                    }
                                );

                                dataSocket.once(
                                    'close',
                                    complete
                                );
                            }
                        );
                    }
                );

            if (
                response.code !== 226 &&
                response.code !== 250
            ) {
                throw new Error(
                    `MLSD transfer failed: ${response.message}`
                );
            }

            return data
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean)
                .map(line =>
                    this.parseMlsdEntry(line)
                );

        } finally {
            dataSocket.destroy();
        }
    }

    public async removeDirectory(
        remoteDir: string
    ): Promise<void> {

        const cwdResponse =
            await this.command(
                `CWD ${remoteDir}`
            );

        if (cwdResponse.code !== 250) {
            return;
        }

        await this.command('CDUP');

        const entries =
            await this.list(remoteDir);

        for (const entry of entries) {

            if (
                entry.name === '.' ||
                entry.name === '..'
            ) {
                continue;
            }

            const remotePath =
                path.posix.join(
                    remoteDir,
                    entry.name
                );

            if (entry.directory) {

                await this.removeDirectory(
                    remotePath
                );

            } else if (entry.file) {

                const response =
                    await this.command(
                        `DELE ${remotePath}`
                    );

                if (response.code !== 250) {
                    throw new Error(
                        `Cannot delete ${remotePath}: ${response.message}`
                    );
                }
            }
        }

        const response =
            await this.command(
                `RMD ${remoteDir}`
            );

        if (response.code !== 250) {
            throw new Error(
                `Cannot remove directory ${remoteDir}: ${response.message}`
            );
        }
    }

    public async ensureDirectory(
        remoteDir: string
    ): Promise<void> {

        const parts =
            remoteDir
                .split('/')
                .filter(Boolean);

        let current = '';

        for (const part of parts) {

            current += `/${part}`;

            const response =
                await this.command(
                    `MKD ${current}`
                );

            if (
                response.code !== 257 &&
                response.code !== 550
            ) {
                throw new Error(
                    `Cannot create directory ${current}: ${response.message}`
                );
            }
        }
    }

    public async close(): Promise<void> {

        const socket = this.socket;

        if (!socket) {
            return;
        }

        try {

            if (
                !this.socketClosed &&
                !this.socketError
            ) {
                await this.command('QUIT');
            }

        } catch {
            // Не маскуємо оригінальну помилку deploy.
        } finally {

            socket.destroy();

            this.socket = null;
            this.socketClosed = true;
        }
    }

    private async openPassiveConnection(): Promise<net.Socket> {

        const response =
            await this.command('EPSV');

        if (response.code !== 229) {
            throw new Error(
                `EPSV failed: ${response.message}`
            );
        }

        const match =
            response.message.match(
                /\(\|\|\|(\d+)\|\)/
            );

        if (!match) {
            throw new Error(
                `Cannot parse EPSV response: ${response.message}`
            );
        }

        const port =
            Number(match[1]);

        const dataSocket =
            net.createConnection({
                host: this.options.host,
                port
            });

        try {

            await this.waitForSocketConnect(
                dataSocket
            );

            return dataSocket;

        } catch (error) {

            dataSocket.destroy();

            throw error;
        }
    }

    /**
     * Виконує FTP-команду, яка використовує data connection.
     *
     * Наприклад:
     *
     *   STOR file.txt
     *   MLSD /directory
     *
     * Послідовність:
     *
     *   command
     *      ↓
     *   150 / 125
     *      ↓
     *   data transfer
     *      ↓
     *   226 / 250
     */
    private async executeDataCommand(
        dataSocket: net.Socket,
        command: string,
        transfer: () => Promise<void>
    ): Promise<FtpResponse> {

        const response =
            await this.command(command);

        if (
            response.code !== 150 &&
            response.code !== 125
        ) {
            throw new Error(
                `${command.split(' ')[0]} failed: ${response.message}`
            );
        }

        await transfer();

        return await this.readResponse();
    }

    private async command(
        command: string,
        hidden = false
    ): Promise<FtpResponse> {

        return this.enqueue(
            async () => {

                this.ensureConnected();

                if (!hidden) {
                    console.log(`> ${command}`);
                }

                this.socket!.write(
                    `${command}\r\n`
                );

                return await this.readResponse();
            }
        );
    }

    /**
     * Гарантує, що FTP-команди не виконуються
     * паралельно на одному control connection.
     */
    private enqueue<T>(
        operation: () => Promise<T>
    ): Promise<T> {

        const result =
            this.commandQueue.then(
                operation,
                operation
            );

        this.commandQueue =
            result.then(
                () => undefined,
                () => undefined
            );

        return result;
    }

    private async readResponse(): Promise<FtpResponse> {

        this.ensureConnected();

        return await new Promise<FtpResponse>(
            (resolve, reject) => {

                let timer: NodeJS.Timeout | undefined;

                const timeout =
                    this.options.timeout ?? 30_000;

                const cleanup = () => {

                    if (timer) {
                        clearTimeout(timer);
                    }

                    this.socket?.off(
                        'data',
                        onData
                    );

                    this.socket?.off(
                        'error',
                        onError
                    );

                    this.socket?.off(
                        'close',
                        onClose
                    );
                };

                const finish = (
                    callback: () => void
                ) => {
                    cleanup();
                    callback();
                };

                const onData = (
                    data: string
                ) => {

                    this.buffer += data;

                    const response =
                        this.tryParseResponse();

                    if (!response) {
                        return;
                    }

                    finish(() => {

                        console.log(
                            `< ${response.code} ${response.message}`
                        );

                        resolve(response);
                    });
                };

                const onError = (
                    error: Error
                ) => {

                    finish(() => {
                        reject(
                            new Error(
                                `FTP control socket error: ${error.message}`
                            )
                        );
                    });
                };

                const onClose = () => {

                    finish(() => {

                        reject(
                            this.socketError ??
                            new Error(
                                'FTP control socket closed unexpectedly'
                            )
                        );
                    });
                };

                this.socket!.on(
                    'data',
                    onData
                );

                this.socket!.once(
                    'error',
                    onError
                );

                this.socket!.once(
                    'close',
                    onClose
                );

                timer = setTimeout(
                    () => {

                        finish(() => {

                            reject(
                                new Error(
                                    `FTP response timeout after ${timeout}ms`
                                )
                            );
                        });

                        this.socket?.destroy();

                    },
                    timeout
                );

                // Дані могли прийти до встановлення
                // цього listener-а.
                onData('');
            }
        );
    }

    private tryParseResponse():
        FtpResponse | null {

        const lines =
            this.buffer.split('\r\n');

        if (lines.length < 2) {
            return null;
        }

        const first =
            lines[0];

        const match =
            first.match(
                /^(\d{3})([ -])(.*)$/
            );

        if (!match) {
            return null;
        }

        const code =
            Number(match[1]);

        const separator =
            match[2];

        if (separator === '-') {

            const endPrefix =
                `${code} `;

            const endIndex =
                lines.findIndex(
                    (line, index) =>
                        index > 0 &&
                        line.startsWith(
                            endPrefix
                        )
                );

            if (endIndex === -1) {
                return null;
            }

            const message =
                lines
                    .slice(
                        0,
                        endIndex + 1
                    )
                    .map(
                        line =>
                            line.substring(4)
                    )
                    .join('\n');

            this.buffer =
                lines
                    .slice(
                        endIndex + 1
                    )
                    .join('\r\n');

            return {
                code,
                message
            };
        }

        this.buffer =
            lines
                .slice(1)
                .join('\r\n');

        return {
            code,
            message: match[3]
        };
    }

    private waitForSocketConnect(
        socket: net.Socket
    ): Promise<void> {

        const timeout =
            this.options.timeout ?? 30_000;

        return new Promise<void>(
            (resolve, reject) => {

                let settled = false;

                const timer =
                    setTimeout(() => {

                        finish(
                            new Error(
                                `FTP socket connection timeout after ${timeout}ms`
                            )
                        );

                        socket.destroy();

                    }, timeout);

                const cleanup = () => {

                    clearTimeout(timer);

                    socket.off(
                        'connect',
                        onConnect
                    );

                    socket.off(
                        'error',
                        onError
                    );

                    socket.off(
                        'close',
                        onClose
                    );
                };

                const finish = (
                    error?: Error
                ) => {

                    if (settled) {
                        return;
                    }

                    settled = true;

                    cleanup();

                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                };

                const onConnect = () => {
                    finish();
                };

                const onError = (
                    error: Error
                ) => {

                    finish(
                        new Error(
                            `FTP socket connection error: ${error.message}`
                        )
                    );
                };

                const onClose = () => {

                    finish(
                        new Error(
                            'FTP socket closed before connection was established'
                        )
                    );
                };

                socket.once(
                    'connect',
                    onConnect
                );

                socket.once(
                    'error',
                    onError
                );

                socket.once(
                    'close',
                    onClose
                );
            }
        );
    }

    private ensureConnected(): void {

        if (!this.socket) {
            throw new Error(
                'FTP control socket is not connected'
            );
        }

        if (this.socket.destroyed) {
            throw new Error(
                'FTP control socket is destroyed'
            );
        }

        if (this.socketClosed) {
            throw new Error(
                'FTP control socket is closed'
            );
        }

        if (this.socketError) {
            throw this.socketError;
        }
    }

    private handleSocketError(
        error: Error
    ): void {

        this.socketError =
            new Error(
                `FTP control socket error: ${error.message}`
            );
    }

    private handleSocketClose(): void {
        this.socketClosed = true;
    }

    private parseMlsdEntry(
        line: string
    ): FtpEntry {

        const separator =
            line.indexOf(' ');

        if (separator === -1) {
            throw new Error(
                `Invalid MLSD entry: ${line}`
            );
        }

        const facts =
            line.substring(
                0,
                separator
            );

        const name =
            line.substring(
                separator + 1
            );

        const type =
            facts
                .split(';')
                .find(fact =>
                    fact.startsWith('type=')
                )
                ?.substring(5);

        return {
            name,
            directory: type === 'dir',
            file: type === 'file'
        };
    }
}
