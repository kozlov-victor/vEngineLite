import {Sprite} from "../vEngineLight/gameObject/Sprite";
import {Texture} from "../vEngineLight/rendering/Texture";
import {FrameAnimation} from "../vEngineLight/animation/FrameAnimation";
import {FrameAnimationPlayer} from "../vEngineLight/animation/FrameAnimationPlayer";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Color} from "../vEngineLight/rendering/Color";
import {Size} from "../vEngineLight/utils/Size";
import {Scene} from "../vEngineLight/application/Scene";
import {SpriteSheet} from "../vEngineLight/types";

export class AnimatedGameObject extends Sprite {

    private readonly player = new FrameAnimationPlayer();
    private readonly walkAnimation:FrameAnimation;
    private readonly idleAnimation:FrameAnimation;
    private readonly fallAnimation:FrameAnimation;

    constructor(scene: Scene, texture: Texture, spriteSheet: SpriteSheet) {
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
        this.walkAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['step1','step2','step3','step4']),
                800
            );
        this.idleAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['idle1','idle2']),
                1600
            );
        this.fallAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['fall1','fall2']),
                800
            );
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

    public fall() {
        this.player.play(this.fallAnimation);
    }

}
