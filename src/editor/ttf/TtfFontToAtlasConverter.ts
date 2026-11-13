import {RasterizedGlyph, TrueTypeFont} from "./TrueTypeFont";
import {BitmapFontAtlas, BitmapFontAtlasBuilder, GlyphFrame} from "./BitmapFontAtlasBuilder";

export class TtfFontToAtlasConverter {

    public convert(ttfFont: ArrayBuffer, fontSize: number, padding: number, maxPageSize: number, charSource: string): BitmapFontAtlas {

        const font = new TrueTypeFont(new Uint8Array(ttfFont));
        const rasterizedGlyphs: RasterizedGlyph[] = [];

        for (const codePoint of this.getCodePointsFromChars(charSource)) {
            const rasterizedGlyph = font.getGlyphBitmap(codePoint, fontSize);
            rasterizedGlyphs.push(rasterizedGlyph);
        }
        const fontAtlasBuilder = new BitmapFontAtlasBuilder(maxPageSize, padding);
        return fontAtlasBuilder.build(rasterizedGlyphs);
    }

    public saveAsFontJson(fileName: string, atlas: BitmapFontAtlas) {

    }

    private getCodePointsFromChars(charset: string): number[] {
        return [...new Set(
            Array.from(charset, char => char.codePointAt(0)!)
        )];
    }

}
