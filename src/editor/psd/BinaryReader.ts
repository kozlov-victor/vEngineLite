export class BinaryReader {
    private offset = 0;

    constructor(private readonly data: Uint8Array) {}

    get position(): number {
        return this.offset;
    }

    get remaining(): number {
        return this.data.length - this.offset;
    }

    uint8(): number {
        return this.data[this.offset++];
    }

    uint16(): number {
        const value =
            (this.data[this.offset] << 8) |
            this.data[this.offset + 1];

        this.offset += 2;

        return value;
    }

    int16(): number {
        const value = this.uint16();

        return value & 0x8000
            ? value - 0x10000
            : value;
    }

    uint32(): number {
        const value =
            this.data[this.offset] * 0x1000000 +
            ((this.data[this.offset + 1] << 16) |
             (this.data[this.offset + 2] << 8) |
             this.data[this.offset + 3]);

        this.offset += 4;

        return value;
    }

    int32(): number {
        const value = this.uint32();

        return value >= 0x80000000
            ? value - 0x100000000
            : value;
    }

    bytes(length: number): Uint8Array {
        const result = this.data.subarray(
            this.offset,
            this.offset + length
        );

        this.offset += length;

        return result;
    }

    string(length: number): string {
        return new TextDecoder("ascii").decode(
            this.bytes(length)
        );
    }

    skip(length: number): void {
        this.offset += length;
    }
}
