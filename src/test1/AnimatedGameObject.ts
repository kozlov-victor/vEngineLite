import {Sprite} from "../vEngineLight/gameObject/Sprite";
import {Texture} from "../vEngineLight/rendering/Texture";
import {FrameAnimation} from "../vEngineLight/animation/FrameAnimation";
import {FrameAnimationPlayer} from "../vEngineLight/animation/FrameAnimationPlayer";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Color} from "../vEngineLight/rendering/Color";
import {Size} from "../vEngineLight/utils/Size";

export class AnimatedGameObject extends Sprite {

    private readonly player = new FrameAnimationPlayer();

    constructor(texture: Texture) {
        super();
        this.scale.xy(1.3);
        this.position.xy(200)
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
        const anim = new FrameAnimation(this, walk, 1000);
        this.player.play(anim);
    }

    public override update(time: number) {
        super.update(time);
        this.player.update(time);
    }

}
