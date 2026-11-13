import {Bitmap} from "./Bitmap";
import { IFrame } from "@vEngineLite/types";
import {TexturePacker} from "../spritesheet/TexturePacker";
import {BitmapGlyph, RasterizedGlyph} from "./TrueTypeFont";


export interface BitmapFontAtlas {
    pages: Bitmap[];
    glyphs: (BitmapGlyph & {pageIndex:number})[];
}

export interface GlyphFrame extends IFrame {
    source: RasterizedGlyph;
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
        sources: RasterizedGlyph[]
    ): BitmapFontAtlas {

        const glyphs: (BitmapGlyph & {pageIndex:number})[] = [];
        const pages: Bitmap[] = [];

        // Порожні гліфи одразу додаємо в метадані.
        const frames: GlyphFrame[] = [];

        for (const source of sources) {

            const { bitmap } = source;

            if (bitmap.width === 0 || bitmap.height === 0) {
                glyphs.push({
                    pageIndex: 0,
                    charCode: source.glyph.charCode,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    offsetX: source.glyph.offsetX,
                    offsetY: source.glyph.offsetY,
                    advanceWidth: source.glyph.advanceWidth
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

                const x = rect.x + this.padding;
                const y = rect.y + this.padding;

                // Копіюємо рядки bitmap без зайвих циклів по пікселях.
                for (let row = 0; row < source.bitmap.height; row++) {

                    const srcStart = row * source.bitmap.width;
                    const dstStart = (y + row) * bitmap.width + x;

                    bitmap.pixels.set(
                        source.bitmap.pixels.subarray(
                            srcStart,
                            srcStart + source.bitmap.width
                        ),
                        dstStart
                    );
                }

                glyphs.push({
                    pageIndex,
                    charCode: source.glyph.charCode,
                    x,
                    y,
                    width: source.bitmap.width,
                    height: source.bitmap.height,
                    offsetX: source.glyph.offsetX,
                    offsetY: source.glyph.offsetY,
                    advanceWidth: source.glyph.advanceWidth
                });
            }
            pages.push(bitmap);
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
                    `Glyph U+${frame.source.glyph.charCode} ` +
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

