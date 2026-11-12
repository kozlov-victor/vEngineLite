import {Bitmap} from "./Bitmap";
import { IFrame } from "@vEngineLite/types";
import {TexturePacker} from "../spritesheet/TexturePacker";
import {BitmapGlyph} from "./TrueTypeFont";

export interface BitmapFontPage {
    index: number;
    bitmap: Bitmap;
}

export interface BitmapFontAtlas {
    pages: BitmapFontPage[];
    glyphs: Map<number, BitmapGlyph>;
}

export interface GlyphSource {
    codePoint: number;
    bitmap: Bitmap;
    offsetX: number;
    offsetY: number;
    advanceWidth: number;
}

interface GlyphFrame extends IFrame {
    source: GlyphSource;
}

interface PackedPage {
    width: number;
    height: number;
    rects: GlyphFrame[];
}

export class BitmapFontAtlasBuilder {

    constructor(
        private readonly maxPageSize = 2048,
        private readonly padding = 1
    ) {}

    public build(
        sources: GlyphSource[]
    ): BitmapFontAtlas {

        const glyphs = new Map<number, BitmapGlyph>();
        const pages: BitmapFontPage[] = [];

        // Порожні гліфи одразу додаємо в метадані.
        const frames: GlyphFrame[] = [];

        for (const source of sources) {

            const { bitmap } = source;

            if (bitmap.width === 0 || bitmap.height === 0) {
                glyphs.set(source.codePoint, {
                    codePoint: source.codePoint,
                    page: -1,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    offsetX: source.offsetX,
                    offsetY: source.offsetY,
                    advanceWidth: source.advanceWidth
                });

                continue;
            }

            frames.push({
                source,
                x: 0,
                y: 0,
                width: bitmap.width + this.padding * 2,
                height: bitmap.height + this.padding * 2
            });
        }

        // Високі гліфи пакуємо першими.
        frames.sort((a, b) => b.height - a.height);

        let currentPage: GlyphFrame[] = [];

        const pack = (items: GlyphFrame[]): PackedPage => {

            // Копіюємо рамки, оскільки TexturePacker
            // змінює координати та сортує масив.
            const rects = items.map(frame => ({
                ...frame
            }));

            const result = new TexturePacker(rects).pack();

            return {
                width: result.width,
                height: result.height,
                rects: result.rects as GlyphFrame[]
            };
        };

        const fits = (page: PackedPage): boolean =>
            page.width <= this.maxPageSize &&
            page.height <= this.maxPageSize;

        const savePage = (items: GlyphFrame[]) => {

            if (items.length === 0)
                return;

            const packed = pack(items);

            if (!fits(packed)) {
                throw new Error("Glyphs exceed maximum atlas page size");
            }

            const pageIndex = pages.length;
            const bitmap = new Bitmap(packed.width, packed.height);

            for (const rect of packed.rects) {

                const source = rect.source;
                const glyphBitmap = source.bitmap;

                const x = rect.x + this.padding;
                const y = rect.y + this.padding;

                // Копіюємо рядки bitmap без зайвих циклів по пікселях.
                for (let row = 0; row < glyphBitmap.height; row++) {

                    const srcStart = row * glyphBitmap.width;
                    const dstStart = (y + row) * bitmap.width + x;

                    bitmap.pixels.set(
                        glyphBitmap.pixels.subarray(
                            srcStart,
                            srcStart + glyphBitmap.width
                        ),
                        dstStart
                    );
                }

                glyphs.set(source.codePoint, {
                    codePoint: source.codePoint,
                    page: pageIndex,
                    x,
                    y,
                    width: glyphBitmap.width,
                    height: glyphBitmap.height,
                    offsetX: source.offsetX,
                    offsetY: source.offsetY,
                    advanceWidth: source.advanceWidth
                });
            }

            pages.push({
                index: pageIndex,
                bitmap
            });
        };

        // Розподіляємо гліфи між сторінками.
        for (const frame of frames) {

            const candidate = [...currentPage, frame];
            const candidatePack = pack(candidate);

            if (fits(candidatePack)) {
                currentPage = candidate;
                continue;
            }

            // Поточну сторінку завершуємо.
            savePage(currentPage);

            // Перевіряємо, чи окремий гліф взагалі поміщається.
            const singlePack = pack([frame]);

            if (!fits(singlePack)) {
                throw new Error(
                    `Glyph U+${frame.source.codePoint.toString(16).toUpperCase()} ` +
                    `exceeds maximum atlas page size`
                );
            }

            currentPage = [frame];
        }

        savePage(currentPage);

        return {
            pages,
            glyphs
        };
    }
}

