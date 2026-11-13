import {BinaryReader} from "../services/BinaryReader";
import {Bitmap} from "./Bitmap";
import {GlyphContour, Rasterizer} from "./Rasterizer";

interface FontTable  {
    tag: string;
    checksum: number;
    offset: number;
    length: number;
}

interface FontHead {
    unitsPerEm: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    indexToLocFormat: number;
}

interface FontMaxp {
    numGlyphs: number;
}

interface FontLoca {
    offsets: number[];
}

interface GlyphHeader {
    index: number;
    numberOfContours: number;

    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;

    offset: number;
    length: number;
}

interface CompositeGlyphComponent {
    flags: number;
    glyphIndex: number;

    argument1: number;
    argument2: number;

    // Матриця трансформації:
    // x' = x * a + y * c
    // y' = x * b + y * d
    a: number;
    b: number;
    c: number;
    d: number;
}

interface GlyphGeometry {
    contours: GlyphContour[];
    points: GlyphPoint[];
}

export interface HorizontalHeader {
    ascent: number;
    descent: number;
    lineGap: number;
    numberOfHMetrics: number;
}

export interface HorizontalMetric {
    advanceWidth: number;
    leftSideBearing: number;
}

interface SimpleGlyphData {
    endPtsOfContours: number[];
    instructionLength: number;
    instructions: Uint8Array;
    flags: number[];
    points: GlyphPoint[];
}

export interface GlyphPoint {
    x: number;
    y: number;
    onCurve: boolean;
}

export interface GlyphSegment {
    type: "line" | "quadratic";

    p0: GlyphPoint;
    p1: GlyphPoint;
    control?: GlyphPoint;
}

export interface BitmapGlyph {
    charCode: number;
    // Позиція та розмір у сторінці.
    x: number;
    y: number;
    width: number;
    height: number;

    // Позиція відносно baseline.
    offsetX: number;
    offsetY: number;

    // Переміщення курсора.
    advanceWidth: number;
}

export interface RasterizedGlyph {
    bitmap: Bitmap;
    glyph: BitmapGlyph;
}

export class TrueTypeFont {

    private static readonly ARG_1_AND_2_ARE_WORDS = 0x0001;
    private static readonly ARGS_ARE_XY_VALUES = 0x0002;
    private static readonly ROUND_XY_TO_GRID = 0x0004;

    private static readonly WE_HAVE_A_SCALE = 0x0008;
    private static readonly MORE_COMPONENTS = 0x0020;
    private static readonly WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
    private static readonly WE_HAVE_A_TWO_BY_TWO = 0x0080;
    private static readonly WE_HAVE_INSTRUCTIONS = 0x0100;

    private readonly reader: BinaryReader;
    private readonly tables = new Map<string, FontTable>();
    private readonly head: FontHead;

    private readonly version: number;
    private readonly numTables: number;
    private readonly maxp: FontMaxp;
    private readonly loca: FontLoca;
    private readonly glyphHeaders: (GlyphHeader|null)[] = [];
    private readonly hhea: HorizontalHeader;
    private readonly hmtx: HorizontalMetric[];
    private readonly cmap: Map<number, number> = new Map();

    constructor(private readonly data: Uint8Array) {
        this.reader = new BinaryReader(data);

        this.version = this.reader.uint32();

        if (this.version !== 0x00010000) {
            throw new Error("Unsupported font format");
        }

        this.numTables = this.reader.uint16();

        // Search parameters
        this.reader.skip(6);

        this.readTableDirectory();
        this.head = this.readHead();
        this.maxp = this.readMaxp();
        this.loca = this.readLoca();
        for (let i = 0; i < this.maxp.numGlyphs; i++) {
            this.glyphHeaders.push(this.getGlyphHeader(i));
        }
        this.hhea = this.readHhea();
        this.hmtx = this.readHmtx();
        this.cmap = this.readCmap();

        const glyphIndex = this.cmap.get(65)!;
        const glyph = this.getSimpleGlyphData(glyphIndex);

        console.log("Points:", glyph.points.length);

    }

    private readHead(): FontHead {
        const reader = this.getTable("head");

        reader.skip(18);

        const unitsPerEm = reader.uint16();

        reader.skip(16);

        const xMin = reader.int16();
        const yMin = reader.int16();
        const xMax = reader.int16();
        const yMax = reader.int16();

        reader.skip(8);

        const indexToLocFormat = reader.int16();

        return {
            unitsPerEm,
            xMin,
            yMin,
            xMax,
            yMax,
            indexToLocFormat
        };
    }

    private readTableDirectory(): void {
        for (let i = 0; i < this.numTables; i++) {
            const tag = this.reader.string(4);
            const checksum = this.reader.uint32();
            const offset = this.reader.uint32();
            const length = this.reader.uint32();

            if (offset + length > this.data.length) {
                throw new Error(`Invalid table bounds: ${tag}`);
            }

            this.tables.set(tag, {
                tag,
                checksum,
                offset,
                length
            });
        }
    }

    private readMaxp(): FontMaxp {
        const reader = this.getTable("maxp");

        const version = reader.uint32();
        const numGlyphs = reader.uint16();

        return {
            numGlyphs
        };
    }

    private readLoca(): FontLoca {
        const reader = this.getTable("loca");
        const offsets: number[] = [];

        for (let i = 0; i <= this.maxp.numGlyphs; i++) {
            const offset = this.head.indexToLocFormat === 0
                ? reader.uint16() * 2
                : reader.uint32();

            offsets.push(offset);
        }

        return { offsets };
    }

    private getSimpleGlyphData(index: number): SimpleGlyphData {
        const header = this.getGlyphHeader(index);

        if (!header) {
            throw new Error(`Glyph ${index} is empty`);
        }

        if (header.numberOfContours < 0) {
            throw new Error(`Glyph ${index} is a composite glyph`);
        }

        if (header.numberOfContours === 0) {
            return {
                endPtsOfContours: [],
                instructionLength: 0,
                instructions: new Uint8Array(),
                flags: [],
                points: []
            };
        }

        const reader = this.getTable("glyf");
        reader.seek(header.offset + 10);

        const endPtsOfContours: number[] = [];

        for (let i = 0; i < header.numberOfContours; i++) {
            endPtsOfContours.push(reader.uint16());
        }

        const instructionLength = reader.uint16();
        const instructions = reader.bytes(instructionLength);

        const numPoints = endPtsOfContours[
        endPtsOfContours.length - 1
            ] + 1;

        const flags: number[] = [];

        while (flags.length < numPoints) {
            const flag = reader.uint8();
            flags.push(flag);

            // REPEAT_FLAG
            if (flag & 0x08) {
                const repeatCount = reader.uint8();

                for (let i = 0; i < repeatCount; i++) {
                    flags.push(flag);
                }
            }
        }

        if (flags.length !== numPoints) {
            throw new Error(`Invalid glyph flags: ${index}`);
        }

        const xCoordinates = this.readCoordinates(
            reader,
            flags,
            0x02,
            0x10
        );

        const yCoordinates = this.readCoordinates(
            reader,
            flags,
            0x04,
            0x20
        );

        const points: GlyphPoint[] = flags.map((flag, i) => ({
            x: xCoordinates[i],
            y: yCoordinates[i],
            onCurve: (flag & 0x01) !== 0
        }));

        return {
            endPtsOfContours,
            instructionLength,
            instructions,
            flags,
            points
        }
    }

    private readCmap(): Map<number, number> {
        const reader = this.getTable("cmap");

        const version = reader.uint16();
        const numTables = reader.uint16();

        if (version !== 0) {
            throw new Error(`Unsupported cmap version: ${version}`);
        }

        let format4Offset = -1;

        for (let i = 0; i < numTables; i++) {
            const platformId = reader.uint16();
            const encodingId = reader.uint16();
            const offset = reader.uint32();

            // Windows Unicode BMP
            // згодом варто додати:
            //     - Unicode Format 4 — BMP.
            // - Unicode Format 12 — повний Unicode, включно з символами поза BMP.
            if (platformId === 3 && encodingId === 1) {
                format4Offset = offset;
            }
        }

        if (format4Offset < 0) {
            throw new Error("cmap format 4 not found");
        }

        reader.seek(format4Offset);

        const format = reader.uint16();

        if (format !== 4) {
            throw new Error(`Unsupported cmap format: ${format}`);
        }

        const length = reader.uint16();
        const language = reader.uint16();

        const segCount = reader.uint16() / 2;

        reader.skip(6);

        const endCodes: number[] = [];
        const startCodes: number[] = [];
        const idDeltas: number[] = [];
        const idRangeOffsets: number[] = [];

        for (let i = 0; i < segCount; i++) {
            endCodes.push(reader.uint16());
        }

        reader.skip(2);

        for (let i = 0; i < segCount; i++) {
            startCodes.push(reader.uint16());
        }

        for (let i = 0; i < segCount; i++) {
            idDeltas.push(reader.int16());
        }

        const idRangeOffsetStart = reader.position;

        for (let i = 0; i < segCount; i++) {
            idRangeOffsets.push(reader.uint16());
        }

        const glyphMap = new Map<number, number>();

        for (let i = 0; i < segCount; i++) {
            for (let code = startCodes[i]; code <= endCodes[i]; code++) {
                if (code === 0xFFFF) {
                    continue;
                }

                let glyphIndex: number;

                if (idRangeOffsets[i] === 0) {
                    glyphIndex = (code + idDeltas[i]) & 0xFFFF;
                } else {
                    const address =
                        idRangeOffsetStart +
                        i * 2 +
                        idRangeOffsets[i] +
                        (code - startCodes[i]) * 2;

                    const currentPosition = reader.position;

                    reader.seek(address);
                    glyphIndex = reader.uint16();
                    reader.seek(currentPosition);

                    if (glyphIndex !== 0) {
                        glyphIndex = (glyphIndex + idDeltas[i]) & 0xFFFF;
                    }
                }

                if (glyphIndex !== 0) {
                    glyphMap.set(code, glyphIndex);
                }
            }
        }

        return glyphMap;
    }

    private readCoordinates(
        reader: BinaryReader,
        flags: number[],
        shortMask: number,
        sameMask: number
    ): number[] {
        const coordinates: number[] = [];
        let coordinate = 0;

        for (const flag of flags) {
            let delta = 0;

            if (flag & shortMask) {
                const value = reader.uint8();

                delta = flag & sameMask
                    ? value
                    : -value;
            }
            else if (!(flag & sameMask)) {
                delta = reader.int16();
            }

            coordinate += delta;
            coordinates.push(coordinate);
        }

        return coordinates;
    }

    private getGlyphHeader(index: number): GlyphHeader | null {
        const range = this.getGlyphRange(index);

        if (range.length === 0) {
            return null;
        }

        const reader = this.getTable("glyf");
        reader.seek(range.offset);

        const numberOfContours = reader.int16();

        const xMin = reader.int16();
        const yMin = reader.int16();
        const xMax = reader.int16();
        const yMax = reader.int16();

        return {
            index,
            numberOfContours,
            xMin,
            yMin,
            xMax,
            yMax,
            offset: range.offset,
            length: range.length
        };
    }

    private getGlyphRange(index: number): { offset: number; length: number } {
        if (index < 0 || index >= this.maxp.numGlyphs) {
            throw new Error(`Invalid glyph index: ${index}`);
        }

        const start = this.loca.offsets[index];
        const end = this.loca.offsets[index + 1];

        return {
            offset: start,
            length: end - start
        };
    }

    private readHhea(): HorizontalHeader {
        const reader = this.getTable("hhea");

        reader.skip(4); // version
        const ascent = reader.int16();
        const descent = reader.int16();
        const lineGap = reader.int16();

        reader.skip(24);

        const numberOfHMetrics = reader.uint16();

        return {
            ascent,
            descent,
            lineGap,
            numberOfHMetrics
        };
    }

    private readHmtx(): HorizontalMetric[] {
        const reader = this.getTable("hmtx");

        const metrics: HorizontalMetric[] = [];

        const numGlyphs = this.maxp.numGlyphs;
        const numHMetrics = this.hhea.numberOfHMetrics;

        let lastAdvanceWidth = 0;

        for (let i = 0; i < numHMetrics; i++) {
            lastAdvanceWidth = reader.uint16();

            metrics.push({
                advanceWidth: lastAdvanceWidth,
                leftSideBearing: reader.int16()
            });
        }

        for (let i = numHMetrics; i < numGlyphs; i++) {
            metrics.push({
                advanceWidth: lastAdvanceWidth,
                leftSideBearing: reader.int16()
            });
        }

        return metrics;
    }

    private buildContours(
        points: GlyphPoint[],
        endPtsOfContours: number[]
    ): GlyphContour[] {
        const contours: GlyphContour[] = [];

        let start = 0;

        for (const end of endPtsOfContours) {
            const contourPoints = points.slice(start, end + 1);

            contours.push(this.buildContour(contourPoints));

            start = end + 1;
        }

        return contours;
    }

    private getGlyphGeometry(
        glyphIndex: number,
        visited = new Set<number>()
    ): GlyphGeometry {

        if (visited.has(glyphIndex)) {
            throw new Error(`Circular composite glyph reference: ${glyphIndex}`);
        }

        const header = this.glyphHeaders[glyphIndex];

        if (!header || header.numberOfContours === 0) {
            return {
                contours: [],
                points: []
            };
        }

        // Простий гліф.
        if (header.numberOfContours > 0) {
            const glyphData = this.getSimpleGlyphData(glyphIndex);

            return {
                points: glyphData.points.map(point => ({ ...point })),
                contours: this.buildContours(
                    glyphData.points,
                    glyphData.endPtsOfContours
                )
            };
        }

        // Складений гліф.
        const nextVisited = new Set(visited);
        nextVisited.add(glyphIndex);

        const components = this.readCompositeGlyph(glyphIndex);

        const result: GlyphGeometry = {
            contours: [],
            points: []
        };

        for (const component of components) {

            // Рекурсивно отримуємо геометрію компонента.
            const child = this.getGlyphGeometry(
                component.glyphIndex,
                nextVisited
            );

            // Спочатку застосовуємо матрицю трансформації.
            const transformedPoints = child.points.map(point => ({
                ...point,
                x: point.x * component.a + point.y * component.c,
                y: point.x * component.b + point.y * component.d
            }));

            let offsetX: number;
            let offsetY: number;

            if (component.flags & TrueTypeFont.ARGS_ARE_XY_VALUES) {

                offsetX = component.argument1;
                offsetY = component.argument2;

                // SCALED_COMPONENT_OFFSET:
                // зміщення також проходить через матрицю компонента.
                if (component.flags & 0x0800) {
                    const x = offsetX;
                    const y = offsetY;

                    offsetX = x * component.a + y * component.c;
                    offsetY = x * component.b + y * component.d;
                }

            } else {

                // Прив'язка точки дочірнього гліфа
                // до точки вже зібраного батьківського гліфа.
                const parentPoint = result.points[component.argument1];
                const childPoint = transformedPoints[component.argument2];

                if (!parentPoint || !childPoint) {
                    throw new Error(
                        `Invalid point attachment in composite glyph ${glyphIndex}`
                    );
                }

                offsetX = parentPoint.x - childPoint.x;
                offsetY = parentPoint.y - childPoint.y;
            }

            // ROUND_XY_TO_GRID.
            if (component.flags & TrueTypeFont.ROUND_XY_TO_GRID) {
                offsetX = Math.round(offsetX);
                offsetY = Math.round(offsetY);
            }

            // Переносимо точки компонента.
            const finalPoints = transformedPoints.map(point => ({
                ...point,
                x: point.x + offsetX,
                y: point.y + offsetY
            }));

            // Трансформуємо всі сегменти контурів.
            const finalContours = child.contours.map(contour => ({
                segments: contour.segments.map(segment => ({
                    ...segment,
                    p0: {
                        ...segment.p0,
                        x: segment.p0.x * component.a +
                            segment.p0.y * component.c + offsetX,
                        y: segment.p0.x * component.b +
                            segment.p0.y * component.d + offsetY
                    },
                    p1: {
                        ...segment.p1,
                        x: segment.p1.x * component.a +
                            segment.p1.y * component.c + offsetX,
                        y: segment.p1.x * component.b +
                            segment.p1.y * component.d + offsetY
                    },
                    ...(segment.control && {
                        control: {
                            ...segment.control,
                            x: segment.control.x * component.a +
                                segment.control.y * component.c + offsetX,
                            y: segment.control.x * component.b +
                                segment.control.y * component.d + offsetY
                        }
                    })
                }))
            }));

            result.points.push(...finalPoints);
            result.contours.push(...finalContours);
        }

        return result;
    }

    private getGlyphContours(glyphIndex: number): GlyphContour[] {
        return this.getGlyphGeometry(glyphIndex).contours;
    }

    private buildContour(points: GlyphPoint[]): GlyphContour {
        const expanded: GlyphPoint[] = [];

        // Додаємо точки та проміжні on-curve точки
        for (let i = 0; i < points.length; i++) {
            const current = points[i];
            const next = points[(i + 1) % points.length];

            expanded.push(current);

            if (!current.onCurve && !next.onCurve) {
                expanded.push({
                    x: (current.x + next.x) / 2,
                    y: (current.y + next.y) / 2,
                    onCurve: true
                });
            }
        }

        // Знаходимо початкову on-curve точку
        const startIndex = expanded.findIndex(p => p.onCurve);

        if (startIndex === -1) {
            throw new Error("Invalid glyph contour");
        }

        const segments: GlyphSegment[] = [];

        let index = startIndex;

        do {
            const p0 = expanded[index];
            const nextIndex = (index + 1) % expanded.length;
            const next = expanded[nextIndex];

            if (next.onCurve) {
                segments.push({
                    type: "line",
                    p0,
                    p1: next
                });

                index = nextIndex;
            } else {
                const endIndex = (nextIndex + 1) % expanded.length;
                const end = expanded[endIndex];

                if (!end.onCurve) {
                    throw new Error("Invalid contour sequence");
                }

                segments.push({
                    type: "quadratic",
                    p0,
                    control: next,
                    p1: end
                });

                index = endIndex;
            }

        } while (index !== startIndex);

        return { segments };
    }

    private getTable(tag: string): BinaryReader {
        const table = this.tables.get(tag);

        if (!table) {
            throw new Error(`Missing font table: ${tag}`);
        }

        return new BinaryReader(
            this.data.subarray(
                table.offset,
                table.offset + table.length
            )
        );
    }


    private readCompositeGlyph(
        glyphIndex: number
    ): CompositeGlyphComponent[] {

        const range = this.getGlyphRange(glyphIndex);

        const glyf = this.getTable("glyf");

        glyf.seek(range.offset);
        glyf.skip(10);

        const components: CompositeGlyphComponent[] = [];

        let flags: number;

        do {
            flags = glyf.uint16();

            const componentGlyphIndex = glyf.uint16();

            const words = (flags & TrueTypeFont.ARG_1_AND_2_ARE_WORDS) !== 0;
            const xyValues = (flags & TrueTypeFont.ARGS_ARE_XY_VALUES) !== 0;

            let argument1: number;
            let argument2: number;

            if (words) {
                argument1 = xyValues ? glyf.int16() : glyf.uint16();
                argument2 = xyValues ? glyf.int16() : glyf.uint16();
            } else {
                const arg1 = glyf.uint8();
                const arg2 = glyf.uint8();

                argument1 = xyValues
                    ? (arg1 > 127 ? arg1 - 256 : arg1)
                    : arg1;

                argument2 = xyValues
                    ? (arg2 > 127 ? arg2 - 256 : arg2)
                    : arg2;
            }

            // Початкова матриця — одинична.
            let a = 1;
            let b = 0;
            let c = 0;
            let d = 1;

            if (flags & TrueTypeFont.WE_HAVE_A_SCALE) {
                const scale = glyf.int16() / 16384;

                a = scale;
                d = scale;

            } else if (flags & TrueTypeFont.WE_HAVE_AN_X_AND_Y_SCALE) {
                a = glyf.int16() / 16384;
                d = glyf.int16() / 16384;

            } else if (flags & TrueTypeFont.WE_HAVE_A_TWO_BY_TWO) {
                a = glyf.int16() / 16384;
                b = glyf.int16() / 16384;
                c = glyf.int16() / 16384;
                d = glyf.int16() / 16384;
            }

            components.push({
                flags,
                glyphIndex: componentGlyphIndex,
                argument1,
                argument2,
                a,
                b,
                c,
                d
            });

        } while (flags & TrueTypeFont.MORE_COMPONENTS);

        // Після останнього компонента можуть бути інструкції.
        if (flags & TrueTypeFont.WE_HAVE_INSTRUCTIONS) {
            const instructionLength = glyf.uint16();
            glyf.skip(instructionLength);
        }

        return components;
    }

    public getGlyphBitmap(
        codePoint: number,
        size: number
    ): RasterizedGlyph {

        const glyphIndex = this.cmap.get(codePoint) ?? 0;
        const header = this.glyphHeaders[glyphIndex];

        const scale = size / this.head.unitsPerEm;

        const advanceWidth =
            (this.hmtx[glyphIndex]?.advanceWidth ?? 0) * scale;

        // Порожній гліф (наприклад, пробіл).
        if (!header || header.numberOfContours === 0) {
            return {
                bitmap: new Bitmap(0, 0),
                glyph: {
                    charCode: codePoint,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    offsetX: 0,
                    offsetY: 0,
                    advanceWidth,
                }
            };
        }

        // Отримуємо геометрію простого або складеного гліфа.
        const geometry = this.getGlyphGeometry(glyphIndex);

        // Якщо гліф не має контурів.
        if (geometry.contours.length === 0) {
            return {
                bitmap: new Bitmap(0, 0),
                glyph: {
                    charCode: codePoint,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    offsetX: 0,
                    offsetY: 0,
                    advanceWidth,
                }
            };
        }

        // Перетворюємо квадратичні криві на полігони.
        const polygons = Rasterizer.flattenContours(
            geometry.contours,
            24
        );

        // Межі гліфа у пікселях.
        const xMin = Math.floor(header.xMin * scale);
        const xMax = Math.ceil(header.xMax * scale);

        const yMin = Math.floor(-header.yMax * scale);
        const yMax = Math.ceil(-header.yMin * scale);

        const width = Math.max(1, xMax - xMin);
        const height = Math.max(1, yMax - yMin);

        const bitmap = new Bitmap(width, height);

        // Масштабуємо контури та переносимо їх
        // у локальну систему координат Bitmap.
        const scaledContours = polygons.map(contour =>
            contour.map(point => ({
                x: point.x * scale - xMin,
                y: -point.y * scale - yMin
            }))
        );

        // Растеризація зі згладжуванням 4x4.
        Rasterizer.fillContours(
            bitmap,
            scaledContours,
            true,
            4
        );

        return {
            bitmap,
            glyph: {
                charCode: codePoint,
                x: 0,
                y: 0,
                width,
                height,
                offsetX: xMin,
                offsetY: yMin,
                advanceWidth,
            }
        };
    }

    public getAllCodePoints(): number[] {
        return [...this.cmap.keys()].sort((a, b) => a - b);
    }


}
