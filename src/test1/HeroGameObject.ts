import {Texture} from "../vEngineLight/rendering/Texture";
import {FrameAnimation} from "../vEngineLight/animation/FrameAnimation";
import {FrameAnimationPlayer} from "../vEngineLight/animation/FrameAnimationPlayer";
import {Scene} from "../vEngineLight/application/Scene";
import {IFrame, SpriteSheet} from "../vEngineLight/types";
import {ArcadeRigidBody, ArcadeRigidBodyType} from "../vEngineLight/physics/ArcadePhysics";
import {ImageSprite} from "../vEngineLight/gameObject/ImageSprite";

export class HeroGameObject extends ImageSprite {

    private readonly player = new FrameAnimationPlayer();
    private readonly walkAnimation:FrameAnimation;
    private readonly idleAnimation:FrameAnimation;
    private readonly fallAnimation:FrameAnimation;
    private readonly sidDownAnimation:FrameAnimation;

    private readonly bodyRef: ArcadeRigidBody;
    private readonly regularBodyRect: IFrame = {x: 25, y: 2, width: 15, height: 62};
    private readonly sitBodyRect: IFrame = {x: 25, y: 2, width: 15, height: 62};
    private sit = false;

    constructor(scene: Scene, texture: Texture, spriteSheet: SpriteSheet) {
        super(scene, texture);

        this.position.xy(200,250);

        const body = scene.app.physics.createRigidBody({
            type: ArcadeRigidBodyType.DYNAMIC,
            target: this,
            rect: this.regularBodyRect
        });
        this.body = body;
        this.bodyRef = body;

        this.walkAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_step1','hero_step2','hero_step3','hero_step4']),
                800
            );
        this.idleAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_idle1','hero_idle2']),
                1600
            );
        this.fallAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_fall1','hero_fall2']),
                800
            );
        this.sidDownAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_sit_down1','hero_sit_down2']),
                1500
            );
    }

    public override update(dt:number) {
        super.update(dt);
        const time = this.scene.app.getTime();
        this.player.update(time);
    }

    public walk() {
        this.sit = false;
        this.bodyRef.rect = this.regularBodyRect;
        this.player.play(this.walkAnimation);
    }

    public idle() {
        this.sit = false;
        this.bodyRef.rect = this.regularBodyRect;
        this.player.play(this.idleAnimation);
    }

    public fall() {
        this.sit = false;
        this.bodyRef.rect = this.regularBodyRect;
        this.player.play(this.fallAnimation);
    }

    public sitDown() {
        this.sit = true;
        this.bodyRef.rect = this.sitBodyRect;
        this.player.play(this.sidDownAnimation);
    }

    public getRigidBody() {
        return this.bodyRef;
    }

    public isSiting() {
        return this.sit;
    }

}
