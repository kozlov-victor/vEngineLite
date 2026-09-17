import {Sprite} from "./Sprite";
import {Scene} from "../application/Scene";
import {Texture} from "../rendering/Texture";
import {Vector2} from "../utils/Vector2";
import {Size} from "../utils/Size";
import {Color} from "../rendering/Color";

export class ImageSprite extends Sprite {

    constructor(scene: Scene, texture: Texture) {
        const textureInfo = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(texture.width, texture.height),
            },
            color: Color.WHITE(),
        };
        super(scene, textureInfo);
    }
}
