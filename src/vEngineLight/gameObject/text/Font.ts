import {Texture} from "../../rendering/Texture";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";
import {GLUtils} from "../../utils/GLUtils";

export interface FontCreateOptions {
    // [style] [variant] [weight] [size] [line-height] [family]  bold italic 10px Arial
    readonly font: string;
    readonly chars?: string;
    readonly padding?: number;
    readonly spacing?: number;
    readonly lineHeight?: number;
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

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        ctx.font = options.font;
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

        const atlasWidth =
            metrics.reduce(
                (width, m) => width + m.width + spacing,
                0
            ) + padding * 2;

        const atlasHeight = lineHeight + padding * 2;

        canvas.width = atlasWidth;
        canvas.height = atlasHeight;

        ctx.font = options.font;
        ctx.textBaseline = "alphabetic";
        ctx.clearRect(0, 0, atlasWidth, atlasHeight);
        ctx.fillStyle = 'white';

        const charsInfoPartial: Record<
            string,
            Omit<CharInfo, "texture">
        > = {};

        let x = padding;

        for (const m of metrics) {
            const y = padding + ascent;

            ctx.fillText(m.ch, x, y);

            charsInfoPartial[m.ch] = {
                pos: new Vector2(x, padding),
                size: new Size(m.width, lineHeight),
                advance: m.advance,
            };

            x += m.width + spacing;
        }

        const texture = GLUtils.createTextureFromImage(canvas);

        const charsInfo: Record<string, CharInfo> = {};

        for (const char of Object.keys(charsInfoPartial)) {
            charsInfo[char] = {
                ...charsInfoPartial[char],
                texture,
            };
        }

        return new Font({
            chars: charsInfo,
        });
    }
}
