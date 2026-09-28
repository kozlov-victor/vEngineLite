import {Texture} from "@vEngineLite/rendering/Texture";
import {MathEx} from "@vEngineLite/utils/MathEx";
import {Color} from "@vEngineLite/rendering/Color";
import {Scene} from "@vEngineLite/application/Scene";
import {Sprite} from "@vEngineLite/gameObject/Sprite";

export class Particle extends Sprite {

    constructor(scene: Scene, texture: Texture) {
        super(scene, texture);
        const color = new Color(
            MathEx.randomInt(0,255),
            MathEx.randomInt(0,255),
            MathEx.randomInt(0,255)
        );
        this.textureInfo.color.from(color);
        const size = 16;
        this.size.wh(size);
        this.position.xy(MathEx.randomInt(0,scene.app.size.w),MathEx.randomInt(0,scene.app.size.h));
        this.pivot.xy(size / 2, size / 2);
    }

    public override update(time: number) {
        super.update(time);
        this.rotation += 0.01;
    }

}
