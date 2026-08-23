import { BinaryReader } from "./BinaryReader";

export interface PsdHeader {
    version: number;
    channels: number;
    width: number;
    height: number;
    depth: number;
    colorMode: number;
}

interface PsdChannel {
    id: number;
    length: number;
}

export interface PsdLayer {
    name: string;

    top: number;
    left: number;
    bottom: number;
    right: number;

    width: number;
    height: number;

    channels: PsdChannel[];
    pixels: Uint8Array;
}

export class PsdParser {

    constructor(
        private readonly reader: BinaryReader
    ) {
    }

    public parse(): {header:PsdHeader,layers:PsdLayer[]} {

        const header = this.readPsdHeader();

        // На даному етапі підтримуємо
        // тільки звичайний PSD, не PSB.
        if (header.version !== 1) {
            throw new Error(
                "Only PSD files are supported"
            );
        }

        // 8 bit/channel
        if (header.depth !== 8) {
            throw new Error(
                "Only 8-bit PSD files are supported"
            );
        }

        // RGB
        if (header.colorMode !== 3) {
            throw new Error(
                "Only RGB PSD files are supported"
            );
        }

        // Color Mode Data
        this.skipSection();

        // Image Resources
        this.skipSection();

        // Layer and Mask Information
        const layers = this.readLayerAndMaskInfo();
        return {header, layers};
    }

    private readPsdHeader(): PsdHeader {

        const reader = this.reader;

        const signature = reader.string(4);

        if (signature !== "8BPS") {
            throw new Error(
                `Invalid PSD signature: ${signature}`
            );
        }

        const version = reader.uint16();

        if (version !== 1 && version !== 2) {
            throw new Error(
                `Unsupported PSD version: ${version}`
            );
        }

        // Reserved
        reader.skip(6);

        const channels = reader.uint16();
        const height = reader.uint32();
        const width = reader.uint32();
        const depth = reader.uint16();
        const colorMode = reader.uint16();

        return {
            version,
            channels,
            width,
            height,
            depth,
            colorMode
        };
    }

    private skipSection(): void {

        const length = this.reader.uint32();

        this.reader.skip(length);
    }

    private readLayerAndMaskInfo(): PsdLayer[] {

        const reader = this.reader;

        const length = reader.uint32();

        if (length === 0) {
            return [];
        }

        const end =
            reader.position + length;

        const layers =
            this.readLayerInfo();

        // Після Layer Info можуть залишатися:
        //
        // Global Layer Mask Info
        // Additional Layer Information
        //
        // Поки вони нам не потрібні.

        if (reader.position < end) {
            reader.skip(
                end - reader.position
            );
        }

        return layers;
    }

    private readLayerInfo(): PsdLayer[] {

        const reader = this.reader;

        const length = reader.uint32();

        if (length === 0) {
            return [];
        }

        const end =
            reader.position + length;

        const rawLayerCount =
            reader.int16();

        const layerCount =
            Math.abs(rawLayerCount);

        const layers: PsdLayer[] = [];

        for (
            let i = 0;
            i < layerCount;
            i++
        ) {
            layers.push(
                this.readLayerRecord()
            );
        }

        // Тут починаються channel pixel data
        this.readLayerPixelData(layers);

        // Перевіряємо, що весь Layer Info
        // був прочитаний.
        if (reader.position > end) {
            throw new Error(
                "Layer info exceeds declared length"
            );
        }

        // Якщо після pixel data залишилися
        // якісь байти — пропускаємо їх.
        if (reader.position < end) {
            reader.skip(
                end - reader.position
            );
        }

        return layers;
    }

    private readLayerRecord(): PsdLayer {

        const reader = this.reader;

        // -------------------------
        // Rectangle
        // -------------------------

        const top = reader.int32();
        const left = reader.int32();
        const bottom = reader.int32();
        const right = reader.int32();

        // -------------------------
        // Channels
        // -------------------------

        const channelCount =
            reader.uint16();

        const channels =
            this.readChannels(channelCount);

        // -------------------------
        // Blend mode
        // -------------------------

        const blendSignature =
            reader.string(4);

        if (
            blendSignature !== "8BIM" &&
            blendSignature !== "8B64"
        ) {
            throw new Error(
                `Invalid blend signature: ${blendSignature}`
            );
        }

        // Нам поки не потрібен сам blend mode.
        reader.string(4);

        // -------------------------
        // Opacity
        // -------------------------

        reader.uint8();

        // -------------------------
        // Clipping
        // -------------------------

        reader.uint8();

        // -------------------------
        // Flags
        // -------------------------

        reader.uint8();

        // -------------------------
        // Filler
        // -------------------------

        reader.uint8();

        // -------------------------
        // Extra data
        // -------------------------

        const name =
            this.readLayerExtraData();

        return {
            name,

            top,
            left,
            bottom,
            right,

            width: right - left,
            height: bottom - top,
            pixels: new Uint8Array(0),

            channels
        };
    }

    private readChannels(
        count: number
    ): PsdChannel[] {

        const channels: PsdChannel[] = [];

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const id =
                this.reader.int16();

            const length =
                this.reader.uint32();

            channels.push({
                id,
                length
            });
        }

        return channels;
    }

    private readPascalString(): string {

        const reader = this.reader;

        const length =
            reader.uint8();

        const bytes =
            reader.bytes(length);

        /*
         * Pascal string у PSD
         * вирівняний до 4 байтів.
         */

        const totalLength =
            1 + length;

        const padding =
            (4 - (totalLength % 4)) % 4;

        reader.skip(padding);

        return new TextDecoder(
            "latin1"
        ).decode(bytes);
    }

    private readLayerExtraData(): string {

        const reader = this.reader;

        // -------------------------
        // Extra data length
        // -------------------------

        const extraLength =
            reader.uint32();

        const extraEnd =
            reader.position + extraLength;

        // -------------------------
        // Mask data
        // -------------------------

        const maskLength =
            reader.uint32();

        reader.skip(maskLength);

        // -------------------------
        // Blending ranges
        // -------------------------

        const blendingRangesLength =
            reader.uint32();

        reader.skip(
            blendingRangesLength
        );

        // -------------------------
        // Layer name
        // -------------------------

        let name =
            this.readPascalString();

        // -------------------------
        // Additional layer information
        // -------------------------

        while (
            reader.position < extraEnd
            ) {

            const signature =
                reader.string(4);

            if (
                signature !== "8BIM" &&
                signature !== "8B64"
            ) {
                throw new Error(
                    `Invalid additional layer ` +
                    `information signature: ${signature}`
                );
            }

            const key =
                reader.string(4);

            const length =
                reader.uint32();

            /*
             * Поки Additional Layer Information
             * нам не потрібна.
             *
             * Пізніше тут можна буде обробити:
             *
             * luni — Unicode layer name
             * lsct — section divider
             * lyid — layer ID
             * ...
             */

            reader.skip(length);

            /*
             * Additional layer information
             * вирівнюється до парної кількості байтів.
             */

            if (length & 1) {
                reader.skip(1);
            }
        }

        if (reader.position !== extraEnd) {
            throw new Error(
                `Layer extra data parsing error: ` +
                `${reader.position} !== ${extraEnd}`
            );
        }

        return name;
    }

    private readLayerPixelData(
        layers: PsdLayer[]
    ): void {

        for (const layer of layers) {

            const channels =
                new Map<number, Uint8Array>();

            for (const channel of layer.channels) {

                const data =
                    this.readChannelData(
                        layer,
                        channel
                    );

                channels.set(
                    channel.id,
                    data
                );
            }

            layer.pixels =
                this.createRgbaPixels(
                    layer,
                    channels
                );
        }
    }

    private readChannelData(
        layer: PsdLayer,
        channel: PsdChannel
    ): Uint8Array {

        if (channel.length < 2) {
            throw new Error(
                `Invalid channel length: ${channel.length}`
            );
        }

        const compression =
            this.reader.uint16();

        const dataLength =
            channel.length - 2;

        switch (compression) {
            case 0:
                return this.readRawChannel(
                    layer.width,
                    layer.height,
                    dataLength
                );

            case 1:
                return this.readRleChannel(
                    layer.width,
                    layer.height,
                    dataLength
                );

            default:
                throw new Error(
                    `Unsupported PSD compression: ${compression}`
                );
        }
    }

    private readRawChannel(
        width: number,
        height: number,
        dataLength: number
    ): Uint8Array {

        const expectedLength =
            width * height;

        if (dataLength !== expectedLength) {
            throw new Error(
                `Invalid RAW channel length: ` +
                `${dataLength}, expected ${expectedLength}`
            );
        }

        return this.reader.bytes(
            expectedLength
        );
    }

    private createRgbaPixels(
        layer: PsdLayer,
        channels: Map<number, Uint8Array>
    ): Uint8Array {

        const pixelCount =
            layer.width * layer.height;

        const pixels =
            new Uint8Array(
                pixelCount * 4
            );

        const red =
            channels.get(0);

        const green =
            channels.get(1);

        const blue =
            channels.get(2);

        const alpha =
            channels.get(-1);

        for (let i = 0; i < pixelCount; i++) {

            const offset =
                i * 4;

            pixels[offset + 0] =
                red?.[i] ?? 0;

            pixels[offset + 1] =
                green?.[i] ?? 0;

            pixels[offset + 2] =
                blue?.[i] ?? 0;

            pixels[offset + 3] =
                alpha?.[i] ?? 255;
        }

        return pixels;
    }

    private readRleChannel(
        width: number,
        height: number,
        dataLength: number
    ): Uint8Array {

        const compressedData =
            this.reader.bytes(dataLength);

        const reader =
            new BinaryReader(compressedData);

        // -------------------------
        // Row lengths
        // -------------------------

        const rowLengths =
            new Uint16Array(height);

        for (let y = 0; y < height; y++) {
            rowLengths[y] =
                reader.uint16();
        }

        // -------------------------
        // Decode rows
        // -------------------------

        const pixels =
            new Uint8Array(
                width * height
            );

        for (let y = 0; y < height; y++) {

            const rowLength =
                rowLengths[y];

            const rowData =
                reader.bytes(rowLength);

            const row =
                this.decodePackBits(
                    rowData,
                    width
                );

            pixels.set(
                row,
                y * width
            );
        }

        if (reader.position !== dataLength) {
            throw new Error(
                `Invalid RLE channel data length: ` +
                `${reader.position}, expected ${dataLength}`
            );
        }

        return pixels;
    }

    private decodePackBits(
        compressed: Uint8Array,
        expectedLength: number
    ): Uint8Array {

        const result =
            new Uint8Array(expectedLength);

        let input = 0;
        let output = 0;

        while (
            input < compressed.length &&
            output < expectedLength
            ) {

            const control =
                compressed[input++];

            // -------------------------
            // Literal run
            // -------------------------

            if (control <= 127) {

                const count =
                    control + 1;

                if (
                    input + count >
                    compressed.length
                ) {
                    throw new Error(
                        "Invalid PackBits literal run"
                    );
                }

                if (
                    output + count >
                    expectedLength
                ) {
                    throw new Error(
                        "PackBits output exceeds row width"
                    );
                }

                result.set(
                    compressed.subarray(
                        input,
                        input + count
                    ),
                    output
                );

                input += count;
                output += count;

                continue;
            }

            // -------------------------
            // NOP
            // -------------------------

            if (control === 128) {
                continue;
            }

            // -------------------------
            // Repeated byte
            // -------------------------

            const count =
                257 - control;

            if (input >= compressed.length) {
                throw new Error(
                    "Invalid PackBits repeat run"
                );
            }

            if (
                output + count >
                expectedLength
            ) {
                throw new Error(
                    "PackBits output exceeds row width"
                );
            }

            const value =
                compressed[input++];

            result.fill(
                value,
                output,
                output + count
            );

            output += count;
        }

        if (output !== expectedLength) {
            throw new Error(
                `Invalid PackBits row length: ` +
                `${output}, expected ${expectedLength}`
            );
        }

        return result;
    }

}
