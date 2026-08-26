import {Sprite} from "../vEngineLight/gameObject/Sprite";
import {Texture} from "../vEngineLight/rendering/Texture";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {MathEx} from "../vEngineLight/utils/MathEx";
import {Color} from "../vEngineLight/rendering/Color";
import {Size} from "../vEngineLight/utils/Size";
import {Scene} from "../vEngineLight/application/Scene";

export class Particle extends Sprite {

    constructor(scene: Scene, texture: Texture) {
        super(scene);
        const size = 16;
        this.size.wh(size);
        const color = new Color(
            MathEx.randomInt(255),
            MathEx.randomInt(255),
            MathEx.randomInt(255)
        );
        this.textureInfo = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(size),
            },
            color
        };
        //this.transform.position.xy(MathEx.randomInt(this.app.width),MathEx.randomInt(this.app.height));
        this.transform.position.xy(MathEx.randomInt(600),MathEx.randomInt(600));
        this.transform.pivot.xy(size / 2, size / 2);
    }

    public override update(time: number) {
        super.update(time);
        this.transform.rotation += 0.01;
    }

}
