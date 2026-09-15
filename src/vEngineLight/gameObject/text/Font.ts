import {Texture} from "../../rendering/Texture";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";

export interface CharInfo {
    readonly texture: Texture;
    readonly pos: Vector2;
    readonly size: Size;
}

export interface FontContext {
    readonly textures:Texture[];
    readonly chars: Record<string, CharInfo>;
}

export class Font {

    private readonly firstSymbol: string;

    constructor(private readonly context: FontContext) {
        this.firstSymbol = Object.keys(context.chars)[0];
    }

    public getCharInfo(ch:string): CharInfo {
        return (
            this.context.chars[ch] ??
            this.context.chars['?'] ??
            this.context.chars[' '] ??
            this.context.chars[this.firstSymbol]
        );
    }
}

