import {Vector2} from "../utils/Vector2";
import {Texture} from "../rendering/Texture";
import {Color} from "../rendering/Color";
import {Size} from "../utils/Size";

export interface TextureInfo {
    readonly texture: Texture;
    readonly rect: {
        readonly uv: Vector2;
        readonly size: Size;
    }
    readonly color: Color;
}
