import {RenderableContainer} from "../base/RenderableContainer";
import {Scene} from "../../application/Scene";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {Font} from "./Font";
import {GLUtils} from "../../utils/GLUtils";
import {Color} from "../../rendering/Color";
import {Vector2} from "../../utils/Vector2";
import {Size} from "../../utils/Size";

// https://samme.github.io/phaser-examples-mirror/text/text%20bounds.html

export class TextLabel extends RenderableContainer {

    public readonly color = Color.WHITE();

    private text = '';
    private charSize = new Size();

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
    }

    public setText(text: string) {
        this.text = text;
    }

    render(renderer: TriangleBatchRenderer) {
        let x = 0;
        const y = 0;
        const worldMatrix = this.getWorldMatrix();

        for (const ch of this.text) {
            const charInfo = this.font.getCharInfo(ch);
            this.textureInfo.texture = charInfo.texture;
            this.textureInfo.rect.uv.from(charInfo.pos);
            this.textureInfo.rect.size.from(charInfo.size);
            this.charSize.from(charInfo.size);
            renderer.batchSprite(
                this.charSize,
                this.textureInfo,
                worldMatrix,
                x + charInfo.offsetX,
                y + charInfo.offsetY
            );
            x += charInfo.advance;
        }
    }

}
