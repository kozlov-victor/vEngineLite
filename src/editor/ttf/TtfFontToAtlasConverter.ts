import {TrueTypeFont} from "./TrueTypeFont";
import {BitmapFontAtlas, BitmapFontAtlasBuilder, GlyphSource} from "./BitmapFontAtlasBuilder";

export class TtfFontToAtlasConverter {

    public convert(ttfFont: ArrayBuffer, fontSize: number, padding: number, maxPageSize: number, charSource: string): BitmapFontAtlas {

        const font = new TrueTypeFont(new Uint8Array(ttfFont));
        const sources: GlyphSource[] = [];

        for (const codePoint of this.getCodePointsFromChars(charSource)) {
            const result = font.getGlyphBitmap(codePoint, fontSize);
            sources.push({
                codePoint,
                bitmap: result.bitmap,
                offsetX: result.glyph.offsetX,
                offsetY: result.glyph.offsetY,
                advanceWidth: result.glyph.advanceWidth
            });
        }
        const builder = new BitmapFontAtlasBuilder(maxPageSize, padding);
        return builder.build(sources);
    }

    public saveAsFontJson(fileName: string, atlas: BitmapFontAtlas) {

    }

    private getCodePointsFromChars(charset: string): number[] {
        return [...new Set(
            Array.from(charset, char => char.codePointAt(0)!)
        )];
    }

}
