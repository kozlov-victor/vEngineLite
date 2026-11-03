import {Texture} from "@vEngineLite/rendering/Texture";
import {CharInfo, Font} from "@vEngineLite/gameObject/text/Font";
import {Vector2} from "@vEngineLite/utils/Vector2";
import {Size} from "@vEngineLite/utils/Size";
import {AssetManager} from "@vEngineLite/resource/AssetManager";
import {GLUtils} from "@vEngineLite/utils/GLUtils";

export type AngelCodeTextureSource =
    | Texture
    | Texture[]
    | Record<number, Texture>
    | Map<number, Texture>
    | AssetManager
    ;

export interface AngelCodeFontInfo {
    readonly face: string;
    readonly size: number;
    readonly bold: number;
    readonly italic: number;
    readonly charset: string;
    readonly unicode: boolean;
    readonly stretchH: number;
    readonly smooth: number;
    readonly aa: number;
    readonly padding: readonly [number, number, number, number];
    readonly spacing: readonly [number, number];
    readonly outline: number;
}

export interface AngelCodeFontCommon {
    readonly lineHeight: number;
    readonly base: number;
    readonly scaleW: number;
    readonly scaleH: number;
    readonly pages: number;
    readonly packed: boolean;
    readonly alphaChnl: number;
    readonly redChnl: number;
    readonly greenChnl: number;
    readonly blueChnl: number;
}

export interface AngelCodeFontPage {
    readonly id: number;
    readonly file: string;
}

export interface AngelCodeFontChar {
    readonly id: number;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly xoffset: number;
    readonly yoffset: number;
    readonly xadvance: number;
    readonly page: number;
    readonly chnl: number;
}

export interface AngelCodeFontKerning {
    readonly first: number;
    readonly second: number;
    readonly amount: number;
}

export interface AngelCodeFont {
    readonly info: AngelCodeFontInfo;
    readonly common: AngelCodeFontCommon;
    readonly pages: AngelCodeFontPage[];
    readonly chars: AngelCodeFontChar[];
    readonly kernings: AngelCodeFontKerning[];
}

const emptyPadding = (): readonly [number, number, number, number] => [0, 0, 0, 0];
const emptySpacing = (): readonly [number, number] => [0, 0];

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
    if (value === undefined) {
        return fallback;
    }
    const normalized = value.toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
};

const parseNumber = (value: string | undefined, fallback = 0): number => {
    if (value === undefined) {
        return fallback;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const parseTuple = (value: string | undefined, length: number): number[] => {
    const source = value ?? "";
    const parts = source
        .split(",")
        .map(part => Number(part.trim()))
        .filter(part => Number.isFinite(part));

    const result = Array.from({length}, (_, index) => parts[index] ?? 0);
    return result.slice(0, length);
};

const parseKeyValuePairs = (line: string): Record<string, string> => {
    const pairs: Record<string, string> = {};
    const regex = /(\w+)=(".*?"|'.*?'|[^\s]+)/g;
    const matches = line.match(regex) ?? [];

    for (const token of matches) {
        const eqIndex = token.indexOf("=");
        if (eqIndex <= 0) {
            continue;
        }

        const key = token.slice(0, eqIndex);
        const rawValue = token.slice(eqIndex + 1);
        const normalizedValue = rawValue.startsWith('"') || rawValue.startsWith("'")
            ? rawValue.slice(1, -1)
            : rawValue;
        pairs[key] = normalizedValue;
    }

    return pairs;
};

export const parseAngelCodeFont = (source: string): AngelCodeFont => {
    if (typeof source !== "string" || source.trim().length === 0) {
        throw new Error("AngelCode font source is empty.");
    }

    const pages: AngelCodeFontPage[] = [];
    const chars: AngelCodeFontChar[] = [];
    const kernings: AngelCodeFontKerning[] = [];

    let info: Partial<AngelCodeFontInfo> = {
        face: "",
        size: 0,
        bold: 0,
        italic: 0,
        charset: "",
        unicode: false,
        stretchH: 100,
        smooth: 0,
        aa: 0,
        padding: emptyPadding(),
        spacing: emptySpacing(),
        outline: 0,
    };

    let common: Partial<AngelCodeFontCommon> = {
        lineHeight: 0,
        base: 0,
        scaleW: 0,
        scaleH: 0,
        pages: 0,
        packed: false,
        alphaChnl: 0,
        redChnl: 0,
        greenChnl: 0,
        blueChnl: 0,
    };

    for (const rawLine of source.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith(";")) {
            continue;
        }

        const [header, ...rest] = line.split(/\s+/);
        const properties = parseKeyValuePairs(rest.join(" "));

        switch (header) {
            case "info": {
                info = {
                    face: properties.face ?? info.face ?? "",
                    size: parseNumber(properties.size, info.size ?? 0),
                    bold: parseNumber(properties.bold, info.bold ?? 0),
                    italic: parseNumber(properties.italic, info.italic ?? 0),
                    charset: properties.charset ?? info.charset ?? "",
                    unicode: parseBoolean(properties.unicode, info.unicode ?? false),
                    stretchH: parseNumber(properties.stretchH, info.stretchH ?? 100),
                    smooth: parseNumber(properties.smooth, info.smooth ?? 0),
                    aa: parseNumber(properties.aa, info.aa ?? 0),
                    padding: parseTuple(properties.padding, 4) as [number, number, number, number],
                    spacing: parseTuple(properties.spacing, 2) as [number, number],
                    outline: parseNumber(properties.outline, info.outline ?? 0),
                };
                break;
            }

            case "common": {
                common = {
                    lineHeight: parseNumber(properties.lineHeight, common.lineHeight ?? 0),
                    base: parseNumber(properties.base, common.base ?? 0),
                    scaleW: parseNumber(properties.scaleW, common.scaleW ?? 0),
                    scaleH: parseNumber(properties.scaleH, common.scaleH ?? 0),
                    pages: parseNumber(properties.pages, common.pages ?? 0),
                    packed: parseBoolean(properties.packed, common.packed ?? false),
                    alphaChnl: parseNumber(properties.alphaChnl, common.alphaChnl ?? 0),
                    redChnl: parseNumber(properties.redChnl, common.redChnl ?? 0),
                    greenChnl: parseNumber(properties.greenChnl, common.greenChnl ?? 0),
                    blueChnl: parseNumber(properties.blueChnl, common.blueChnl ?? 0),
                };
                break;
            }

            case "page": {
                pages.push({
                    id: parseNumber(properties.id, 0),
                    file: properties.file ?? "",
                });
                break;
            }

            case "chars": {
                break;
            }

            case "char": {
                chars.push({
                    id: parseNumber(properties.id, 0),
                    x: parseNumber(properties.x, 0),
                    y: parseNumber(properties.y, 0),
                    width: parseNumber(properties.width, 0),
                    height: parseNumber(properties.height, 0),
                    xoffset: parseNumber(properties.xoffset, 0),
                    yoffset: parseNumber(properties.yoffset, 0),
                    xadvance: parseNumber(properties.xadvance, 0),
                    page: parseNumber(properties.page, 0),
                    chnl: parseNumber(properties.chnl, 0),
                });
                break;
            }

            case "kernings": {
                break;
            }

            case "kerning": {
                kernings.push({
                    first: parseNumber(properties.first, 0),
                    second: parseNumber(properties.second, 0),
                    amount: parseNumber(properties.amount, 0),
                });
                break;
            }
        }
    }

    if (!info.face) {
        throw new Error("AngelCode font is missing the 'info' block.");
    }

    return {
        info: {
            face: info.face,
            size: info.size ?? 0,
            bold: info.bold ?? 0,
            italic: info.italic ?? 0,
            charset: info.charset ?? "",
            unicode: info.unicode ?? false,
            stretchH: info.stretchH ?? 100,
            smooth: info.smooth ?? 0,
            aa: info.aa ?? 0,
            padding: info.padding ?? emptyPadding(),
            spacing: info.spacing ?? emptySpacing(),
            outline: info.outline ?? 0,
        },
        common: {
            lineHeight: common.lineHeight ?? 0,
            base: common.base ?? 0,
            scaleW: common.scaleW ?? 0,
            scaleH: common.scaleH ?? 0,
            pages: common.pages ?? 0,
            packed: common.packed ?? false,
            alphaChnl: common.alphaChnl ?? 0,
            redChnl: common.redChnl ?? 0,
            greenChnl: common.greenChnl ?? 0,
            blueChnl: common.blueChnl ?? 0,
        },
        pages,
        chars,
        kernings,
    };
};

const getTextureForPage = (
    font: AngelCodeFont,
    source: AngelCodeTextureSource,
    pageId: number,
): Texture => {
    if (source instanceof AssetManager) {
        const fileName = font.pages.find(p=>p.id === pageId)?.file;
        if (!fileName) {
            throw new Error(`Not found ${fileName}`);
        }

        const image = source.getImage(fileName);
        if (!image) {
            throw new Error(`Texture for page ${pageId} was not found in the AssetManager.`);
        }

        return GLUtils.createTextureFromImage(image);
    }

    if (source instanceof Texture) {
        return source;
    }

    if (Array.isArray(source)) {
        return source[pageId] ?? source[0];
    }

    if (source instanceof Map) {
        const mapTexture = source.get(pageId) ?? source.values().next().value;
        if (mapTexture) {
            return mapTexture;
        }
        throw new Error(`Texture for page ${pageId} was not found in the atlas map.`);
    }

    const value = source[pageId];
    if (value) {
        return value;
    }

    const firstTexture = Object.values(source)[0];
    if (firstTexture) {
        return firstTexture;
    }

    throw new Error(`Texture for page ${pageId} was not found in the atlas map.`);
};

export const createFontFromAngelCode = (source: string,sourceTexture: AngelCodeTextureSource
): Font => {
    const font = parseAngelCodeFont(source);
    const charsInfo: Record<string, CharInfo> = {};

    for (const currentChar of font.chars) {
        const texture = getTextureForPage(font, sourceTexture, currentChar.page);
        const ch = String.fromCodePoint(currentChar.id);
        charsInfo[ch] = {
            texture,
            pos: new Vector2(currentChar.x, currentChar.y),
            size: new Size(currentChar.width, currentChar.height),
            advance: currentChar.xadvance,
            offsetX: currentChar.xoffset,
            offsetY: currentChar.yoffset,
        };
    }

    return new Font({chars: charsInfo});
};
