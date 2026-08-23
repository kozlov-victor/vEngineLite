export class Files {
    private static readonly DB_NAME = "fileHandlesDB";
    private static readonly STORE_NAME = "handles";

    // === IndexedDB helpers ===
    private static async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(this.STORE_NAME);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private static async saveHandle(key: string, handle: FileSystemHandle) {
        const db = await this.getDB();
        return new Promise<void>((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, "readwrite");
            tx.objectStore(this.STORE_NAME).put(handle, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    private static async loadHandle<T extends FileSystemHandle>(key: string): Promise<T | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, "readonly");
            const req = tx.objectStore(this.STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result ?? null);
            req.onerror = () => reject(req.error);
        });
    }

    private static async requestPermission(handle: FileSystemHandle, mode: any) { // FileSystemPermissionMode
        const opts = { mode };
        if ((await (handle as any).queryPermission(opts)) === "granted") return true;
        if ((await (handle as any).requestPermission(opts)) === "granted") return true;
        return false;
    }

    private static async saveToFileLegacy(data: string | Blob, suggestedName: string, type: string) {
        const blob = typeof data === "string" ? new Blob([data], { type }) : data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = suggestedName;
        a.click();
        URL.revokeObjectURL(url);
        return undefined;
    }

    private static async saveToFileModern(data: string | Blob, suggestedName: string, fileHandle: FileSystemFileHandle|undefined,type = "application/octet-stream") {
        if (!fileHandle || suggestedName!==fileHandle?.name) {
            const lastHandle = await this.loadHandle<FileSystemFileHandle>("lastFile");
            fileHandle = await (window as any).showSaveFilePicker({
                suggestedName,
                startIn: lastHandle ?? "documents",
                types: [
                    {
                        description: "",
                        accept: { [type]: [`.${suggestedName.split(".").pop()}`] },
                    },
                ],
            });
            if (!fileHandle) return undefined;
        }
        await this.saveHandle("lastFile", fileHandle);
        const writable = await fileHandle.createWritable();
        await writable.write(typeof data === "string" ? new Blob([data], { type }) : data);
        await writable.close();
        return fileHandle;
    }

    private static async openFileLegacy(accept: string[]): Promise<File | undefined> {
        return new Promise<File | undefined>((resolve) => {
            let fileInput = document.getElementById("hiddenFileInput") as HTMLInputElement;
            if (!fileInput) {
                fileInput = document.createElement("input");
                document.body.appendChild(fileInput);
            }
            fileInput.type = "file";
            fileInput.id = "hiddenFileInput";
            fileInput.style.visibility = "hidden";
            fileInput.value = "";
            fileInput.accept = accept.map((it) => `.${it}`).join(",");
            fileInput.click();
            fileInput.onchange = (e) => {
                resolve((e.target as HTMLInputElement).files?.[0]);
            };
        });
    }

    public static async openFile(accept: string[]): Promise<{handle:FileSystemFileHandle|undefined, file:File|undefined}> {
        if (!(window as any).showOpenFilePicker) {
            return {
                handle: undefined,
                file: await this.openFileLegacy(accept)
            };
        }

        const lastHandle = await this.loadHandle<FileSystemFileHandle>("lastFile");
        const [fileHandle]: [FileSystemFileHandle | undefined] = await (window as any).showOpenFilePicker({
            startIn: lastHandle ?? 'documents',
            types: [
                {
                    description: accept.join(','),
                    accept: { "application/x-app": accept.map((it) => `.${it}`) },
                },
            ],
            excludeAcceptAllOption: true,
            multiple: false,
        });

        if (fileHandle) {
            await this.saveHandle("lastFile", fileHandle);
            return {handle:fileHandle,file:await fileHandle.getFile()};
        }
        else return {handle:undefined,file:undefined};
    }

    public static async saveToFile(data: string | Blob, suggestedName: string, fileHandle: FileSystemFileHandle|undefined = undefined, type = "application/octet-stream"):Promise<FileSystemFileHandle|undefined> {
        if ((window as any).showSaveFilePicker) {
            return await this.saveToFileModern(data, suggestedName, fileHandle,type);
        }
        else {
            return await this.saveToFileLegacy(data, suggestedName, type);
        }
    }

    public static getFileNameNoExt(name:string) {
        const parts = name.split('.');
        if (parts.length===1) return name;
        parts.pop();
        return parts.join('.');
    }

}
