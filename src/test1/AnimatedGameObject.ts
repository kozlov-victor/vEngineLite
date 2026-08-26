import {Sprite} from "../vEngineLight/gameObject/Sprite";
import {Texture} from "../vEngineLight/rendering/Texture";
import {FrameAnimation} from "../vEngineLight/animation/FrameAnimation";
import {FrameAnimationPlayer} from "../vEngineLight/animation/FrameAnimationPlayer";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Color} from "../vEngineLight/rendering/Color";
import {Size} from "../vEngineLight/utils/Size";
import {Scene} from "../vEngineLight/application/Scene";

export class AnimatedGameObject extends Sprite {

    private readonly player = new FrameAnimationPlayer();

    constructor(scene: Scene, texture: Texture) {
        super(scene);
        this.scale.xy(1);
        this.position.xy(200,250);
        this.textureInfo = {
            texture,
            rect: {
                uv: new Vector2(),
                size: new Size(texture.width, texture.height),
            },
            color: Color.WHITE(),
        };
        const frames = FrameAnimation.framesFromRegularSpriteSheet(texture.width, texture.height, 5, 1);
        const walk = [frames[1], frames[2], frames[3], frames[4]];
        const anim = new FrameAnimation(this, walk, 800);
        this.player.play(anim);
    }

    public override update(dt:number) {
        super.update(dt);
        const time = this.scene.app.getTime();
        this.player.update(time);
    }

}
