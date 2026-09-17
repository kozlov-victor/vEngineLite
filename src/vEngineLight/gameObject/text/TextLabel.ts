import {RenderableContainer} from "../base/RenderableContainer";
import {Scene} from "../../application/Scene";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {CharInfo, Font} from "./Font";
import {GLUtils} from "../../utils/GLUtils";
import {Color} from "../../rendering/Color";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";

// https://samme.github.io/phaser-examples-mirror/text/text%20bounds.html

interface Line {
    x: number;
    y: number;
    readonly words: Word[];
    readonly length: number;
}

interface Word {
    x: number;
    readonly letters: Letter[];
    readonly length: number;
}

interface Letter {
    readonly charInfo: CharInfo;
    readonly x: number;
}

interface RenderableLetter extends Letter {
    y: number;
}

export interface TextParameters {
    wrap: boolean;
    textAlign?:'left'|'right'|'center';
    verticalAlign?:'top' | 'bottom' | 'center';
}

export class TextLabel extends RenderableContainer {

    public readonly color = Color.WHITE();

    private text = '';
    private dirty = true;
    private textParameters: TextParameters = {
        wrap: false,
    }

    private readonly lineHeight = this.font.getCharInfo('!').size.h;
    private readonly spaceWidth = this.font.getCharInfo(' ').advance;
    private readonly charSize = new Size();
    private lines:Line[] = [];
    private renderableLetters:RenderableLetter[] = [];

    constructor(scene: Scene, private readonly font: Font) {
        super(scene);
        this.textureInfo = {
            texture: GLUtils.getEmptyTexture(),
            color: this.color,
            rect: {
                uv: new Vector2(),
                size: new Size(1)
            }
        }
        this.size.onChange(()=>this.dirty = true);
    }

    public setText(text: string) {
        if (this.text===text) return;
        this.dirty = true;
        this.text = text;
    }

    public setTextParameters(parameters:TextParameters) {
        this.textParameters = parameters;
        this.dirty = true;
    }

    public getTextParameters(): TextParameters {
        return {...this.textParameters};
    }

    private prepareText() {
        this.lines.length = 0;
        if (this.textParameters.wrap) {
            this.prepareTextWrap();
        }
        else {
            this.prepareTextNoWrap();
        }
        this.alignHorizontal();
        this.alignVertical();
        this.prepareRenderableLetters();
    }

    private prepareTextWrap() {
        const wordsStr =
            this.text.
                split('\n').join(' ').split(' ').map(it=>it.trim()).filter(it=>it.length);
        const words:Word[] = [];
        for (const wordStr of wordsStr) {
            let x = 0;
            const letters:Letter[] = [];
            for (const ch of wordStr) {
                const charInfo = this.font.getCharInfo(ch);
                const letter:Letter = {charInfo,x};
                letters.push(letter);
                x+=charInfo.advance;
            }
            const word: Word = {
                x: 0,
                letters,
                length: x,
            }
            words.push(word);
        }

        let x = 0, y = 0;
        const boundWidth = this.size.w;
        const boundHeight = this.size.h;
        let wordsOfCurrentLine:Word[] = [];
        for (const word of words) {
            if (y>=boundHeight) {
                wordsOfCurrentLine = [];
                break;
            }
            if (wordsOfCurrentLine.length===0 || x + word.length <= boundWidth) {
                word.x = x;
                wordsOfCurrentLine.push(word);
                x+=word.length + this.spaceWidth;
            }
            else {
                const line:Line = {
                    x: 0,
                    y: y,
                    words: wordsOfCurrentLine,
                    length: x,
                };
                this.lines.push(line);
                x = 0;
                word.x = x;
                x+=word.length + this.spaceWidth;
                wordsOfCurrentLine = [word];
                y+=this.lineHeight;
            }
        }
        if (wordsOfCurrentLine.length!==0) {
            const line:Line = {
                x: 0,
                y: y,
                words: wordsOfCurrentLine,
                length: x,
            };
            this.lines.push(line);
        }
    }

    private prepareTextNoWrap() {
        let x = 0;
        let y = 0;
        let letters:Letter[] = [];
        let wordLength = 0;
        const boundWidth = this.size.w;
        const boundHeight = this.size.h;
        for (const ch of this.text) {
            if (y>=boundHeight) {
                letters = [];
                break;
            }
            if (x>=boundWidth) {
                continue;
            }
            if (ch==='\n') {
                const word: Word = {
                    x: 0,
                    letters: letters,
                    length: wordLength
                };
                const line: Line = {
                    x:0, y,
                    words: [word],
                    length: wordLength
                }
                this.lines.push(line);
                wordLength = 0;
                letters = [];
                x = 0;
                y+=this.lineHeight;
                continue;
            }
            const charInfo = this.font.getCharInfo(ch);
            const letter: Letter = {charInfo,x};
            letters.push(letter);
            wordLength+=charInfo.advance;
            x += charInfo.advance;
        }
        if (letters.length!==0) {
            const word: Word = {
                x: 0,
                letters: letters,
                length: wordLength
            };
            const line: Line = {
                x:0, y,
                words: [word],
                length: wordLength
            }
            this.lines.push(line);
        }
    }

    private alignHorizontal() {
        let boundWidth = this.size.w;
        if (!boundWidth || !Number.isFinite(boundWidth)) {
            boundWidth = Math.max(...this.lines.map(it=>it.length));
        }
        switch (this.textParameters.textAlign) {
            case 'right': {
                for (const line of this.lines) {
                    line.x = boundWidth - line.length;
                }
                break;
            }
            case 'center': {
                for (const line of this.lines) {
                    line.x = (boundWidth - line.length)/2;
                }
                break;
            }
        }
    }

    private alignVertical() {
        let boundHeight = this.size.h;
        if (!boundHeight || !Number.isFinite(boundHeight)) {
            return;
        }
        let offsetY = 0;
        const linesHeight = this.lines.length * this.lineHeight;
        switch (this.textParameters.verticalAlign) {
            case 'center': {
                offsetY = (boundHeight - linesHeight)/2;
                break;
            }
            case 'bottom': {
                offsetY = boundHeight - linesHeight;
                break;
            }
        }
        console.log(offsetY);
        for (const line of this.lines) {
            line.y = offsetY;
            offsetY+=this.lineHeight;
        }
    }

    private prepareRenderableLetters() {
        this.renderableLetters.length = 0;
        for (const line of this.lines) {
            for (const word of line.words) {
                for (const letter of word.letters) {
                    const charInfo = letter.charInfo;
                    const renderableLetter: RenderableLetter = {
                        charInfo,
                        x: line.x + word.x + letter.x,
                        y: line.y,
                    }
                    this.renderableLetters.push(renderableLetter);
                }
            }
        }
    }

    render(renderer: TriangleBatchRenderer) {
        if (this.dirty) {
            this.prepareText();
            this.dirty = false;
        }

        const worldMatrix = this.getWorldMatrix();
        for (const letter of this.renderableLetters) {
            const charInfo = letter.charInfo;
            this.textureInfo.texture = charInfo.texture;
            this.textureInfo.rect.uv.from(charInfo.pos);
            this.textureInfo.rect.size.from(charInfo.size);
            this.charSize.from(charInfo.size);
            renderer.batchSprite(
                this.charSize,
                this.textureInfo,
                worldMatrix,
                letter.x + charInfo.offsetX,
                letter.y + charInfo.offsetY
            );
        }
    }

}
