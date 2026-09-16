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
        const chars = options.chars ?? LAT_CHARS + STANDARD_SYMBOLS + CYR_CHARS;

        const padding = options.padding ?? 2;
        const spacing = options.spacing ?? 2;
        const atlasWidth = options.atlasWidth ?? 256;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d",{alpha:true})!;

        const fontSegments:string[] = [];
        // [style] [variant] [weight] [size] [line-height] [family]  bold italic 10px Arial
        if (options.bold) fontSegments.push('bold');
        if (options.italic) fontSegments.push('italic');
        fontSegments.push(`${options.fontSize ?? 14}px`);
        fontSegments.push(options.fontFamily ?? 'Arial');
        const fontStyle = fontSegments.join(' ')

        ctx.font = fontStyle;
        ctx.textBaseline = "alphabetic";

        const metrics = [...chars].map(ch => {
            const m = ctx.measureText(ch);

            return {
                ch,
                advance: m.width,
                width: Math.ceil(m.width),
                ascent: Math.ceil(m.actualBoundingBoxAscent),
                descent: Math.ceil(m.actualBoundingBoxDescent),
            };
        });

        const ascent = Math.max(...metrics.map(m => m.ascent));
        const descent = Math.max(...metrics.map(m => m.descent));

        const lineHeight =
            options.lineHeight ?? ascent + descent;

        const cellHeight = lineHeight + spacing;

        /*
         * Pack glyphs into rows.
         */
        const positions: {
            ch: string;
            x: number;
            y: number;
            advance: number;
            width: number;
        }[] = [];

        let x = padding;
        let y = padding;

        for (const m of metrics) {
            if (
                x + m.width + padding > atlasWidth &&
                x > padding
            ) {
                x = padding;
                y += cellHeight;
            }

            positions.push({
                ch: m.ch,
                x,
                y,
                advance: m.advance,
                width: m.width,
            });

            x += m.width + spacing;
        }

        const atlasHeight =
            y + lineHeight + padding;

        canvas.width = atlasWidth;
        canvas.height = atlasHeight;


        ctx.font = fontStyle;
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = 'green';
        ctx.clearRect(0, 0, atlasWidth, atlasHeight);

        // ctx.fillStyle = 'green';
        // ctx.fillRect(0, 0, atlasWidth, atlasHeight);

        const fillColor = options.fillColor ?? Color.WHITE();
        ctx.fillStyle = fillColor.toCssColor();

        const charsInfoPartial: Record<string,Omit<CharInfo, "texture">> = {};

        for (const position of positions) {

            const baseline =
                position.y + ascent;

            ctx.fillText(
                position.ch,
                position.x,
                baseline
            );

            charsInfoPartial[position.ch] = {
                pos: new Vector2(
                    position.x,
                    position.y
                ),
                size: new Size(
                    position.width,
                    lineHeight
                ),
                advance: position.advance,
            };
        }

        const imageData = ctx.getImageData(
            0, 0,
            canvas.width,
            canvas.height
        );

        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = fillColor.r;
            data[i + 1] = fillColor.g;
            data[i + 2] = fillColor.b;
        }
        ctx.putImageData(imageData, 0, 0);

        const texture = GLUtils.createTextureFromImage(canvas);

        const charsInfo: Record<string, CharInfo> = {};

        for (const char of Object.keys(charsInfoPartial)) {
            charsInfo[char] = {
                ...charsInfoPartial[char],
                texture,
            };
        }

        document.body.appendChild(canvas);

        return new Font({
            chars: charsInfo,
        });
    }
}
