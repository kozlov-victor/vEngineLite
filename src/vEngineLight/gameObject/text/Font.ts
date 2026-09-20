import {Texture} from "../../rendering/Texture";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";
import {GLUtils} from "../../utils/GLUtils";
import {Color} from "../../rendering/Color";

export interface FontCreateOptions {
    readonly fontFamily?: string;
    readonly bold?: boolean;
    readonly italic?: boolean;
    readonly fontSize?: number;
    readonly chars?: string;
    readonly additionalChars?: string;
    readonly padding?: number;
    readonly spacing?: number;
    readonly lineHeight?: number;
    readonly atlasWidth?: number;
    readonly fillColor?: Color;
}

export interface CharInfo {
    readonly texture: Texture;
    readonly pos: Vector2;
    readonly size: Size;
    readonly advance: number;
    readonly offsetX: number;
    readonly offsetY: number;
}

export interface FontContext {
    readonly chars: Record<string, CharInfo>;
}

export const LAT_CHARS =
    'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz';

export const STANDARD_SYMBOLS =
    '1234567890 ' +
    '"!`?\'.,;:()[]{}<>|/@\\^$-%+=#_&~*';


export const CYR_CHARS =
    'АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНн' +
    'ОоПпРрСсТтУуФфХхЦцЧчШшЩщ' +
    'ЫыЬьЪъЭэЮюЯя' +
    'ЇїІіЄєҐґ';

export class Font {

    private readonly firstSymbol: string;

    constructor(private readonly context: FontContext) {
        this.firstSymbol = Object.keys(context.chars)[0];
    }

    public getCharInfo(ch: string): CharInfo {
        return (
            this.context.chars[ch] ??
            this.context.chars['?'] ??
            this.context.chars[this.firstSymbol]
        );
    }

    public static fromCss(options: FontCreateOptions): Font {

        const chars = [
            ...new Set(
                options.chars ??
                LAT_CHARS + STANDARD_SYMBOLS + CYR_CHARS + (options.additionalChars ?? '')
            )
        ];

        const padding = Math.max(
            0,
            Math.ceil(options.padding ?? 2)
        );

        const spacing = Math.max(
            0,
            Math.ceil(options.spacing ?? 2)
        );

        const atlasWidth = Math.floor(options.atlasWidth ?? 256);

        if (atlasWidth <= 0) {
            throw new Error("Invalid atlas width");
        }

        const fontSize = options.fontSize ?? 14;

        const fontStyle = [
            options.italic ? "italic" : "",
            options.bold ? "bold" : "",
            `${fontSize}px`,
            options.fontFamily ?? "Arial"
        ].filter(Boolean).join(" ");

        // Measurement canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { alpha: true })!;

        ctx.font = fontStyle;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";

        /*
         * Measure actual glyph bounds.
         */
        const metrics = chars.map(ch => {

            const m = ctx.measureText(ch);

            const left = Math.floor(-m.actualBoundingBoxLeft);
            const right = Math.ceil(m.actualBoundingBoxRight);

            const top = Math.floor(-m.actualBoundingBoxAscent);
            const bottom = Math.ceil(m.actualBoundingBoxDescent);

            const width = Math.max(0, right - left);
            const height = Math.max(0, bottom - top);

            return {
                ch,
                advance: m.width,

                left,
                top,

                width,
                height
            };
        });

        /*
         * Common vertical metrics.
         */
        const ascent = Math.max(
            0,
            ...metrics.map(m => -m.top)
        );

        const descent = Math.max(
            0,
            ...metrics.map(m => m.top + m.height)
        );

        const lineHeight =
            options.lineHeight ?? ascent + descent;

        const baselineOffset =
            ascent + (lineHeight - ascent - descent) / 2;

        /*
         * Pack glyphs.
         */
        type GlyphPosition = {
            ch: string;
            x: number;
            y: number;

            width: number;
            height: number;

            advance: number;

            offsetX: number;
            offsetY: number;

            drawX: number;
            drawY: number;
        };

        const positions: GlyphPosition[] = [];

        let x = padding;
        let y = padding;
        let rowHeight = 0;

        for (const m of metrics) {

            const cellWidth = m.width + padding * 2;
            const cellHeight = m.height + padding * 2;

            if (cellWidth > atlasWidth) {
                throw new Error(
                    `Glyph "${m.ch}" exceeds atlas width`
                );
            }

            if (
                x + cellWidth > atlasWidth &&
                x > padding
            ) {
                x = padding;
                y += rowHeight + spacing;
                rowHeight = 0;
            }

            const glyphX = x + padding;
            const glyphY = y + padding;

            positions.push({
                ch: m.ch,

                x,
                y,

                width: cellWidth,
                height: cellHeight,

                advance: m.advance,

                offsetX: m.left - padding,
                offsetY: baselineOffset + m.top - padding,

                drawX: glyphX - m.left,
                drawY: glyphY - m.top
            });

            x += cellWidth + spacing;

            rowHeight = Math.max(
                rowHeight,
                cellHeight
            );
        }

        const atlasHeight = Math.max(
            1,
            Math.ceil(y + rowHeight + padding)
        );

        /*
         * Resize canvas.
         * This resets Canvas 2D state.
         */
        canvas.width = atlasWidth;
        canvas.height = atlasHeight;

        ctx.font = fontStyle;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";

        const fillColor = options.fillColor ?? Color.WHITE();
        ctx.fillStyle = fillColor.toCssColor();

        ctx.clearRect(
            0,
            0,
            atlasWidth,
            atlasHeight
        );

        const charsInfoPartial:
            Record<string, Omit<CharInfo, "texture">> = {};

        /*
         * Render glyphs.
         */
        for (const p of positions) {

            ctx.fillText(
                p.ch,
                p.drawX,
                p.drawY
            );

            charsInfoPartial[p.ch] = {
                pos: new Vector2(p.x, p.y),

                size: new Size(
                    p.width,
                    p.height
                ),

                advance: p.advance,

                offsetX: p.offsetX,
                offsetY: p.offsetY
            };
        }

        /*
         * Upload atlas.
         */
        const texture = GLUtils.createTextureFromImage(canvas);

        const charsInfo: Record<string, CharInfo> = {};

        for (const ch of Object.keys(charsInfoPartial)) {
            charsInfo[ch] = {
                ...charsInfoPartial[ch],
                texture
            };
        }

        return new Font({
            chars: charsInfo
        });
    }
}
