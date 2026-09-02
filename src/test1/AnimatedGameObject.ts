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
    private readonly walkAnimation:FrameAnimation;
    private readonly idleAnimation:FrameAnimation;

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
        const frames = FrameAnimation.framesFromRegularSpriteSheet(texture.width, texture.height, 6, 1);
        this.walkAnimation = new FrameAnimation(this, [frames[2], frames[3], frames[4], frames[5]], 800);
        this.idleAnimation = new FrameAnimation(this, [frames[0],frames[1]], 1600);
    }

    public override update(dt:number) {
        super.update(dt);
        const time = this.scene.app.getTime();
        this.player.update(time);
    }

    public walk() {
        this.player.play(this.walkAnimation);
    }

    public idle() {
        this.player.play(this.idleAnimation);
    }

}
