import {Texture} from "../../vEngineLight/rendering/Texture";
import {FrameAnimation} from "../../vEngineLight/animation/FrameAnimation";
import {FrameAnimationPlayer} from "../../vEngineLight/animation/FrameAnimationPlayer";
import {Scene} from "../../vEngineLight/application/Scene";
import {IFrame, SpriteSheet} from "../../vEngineLight/types";
import {ArcadeRigidBody, ArcadeRigidBodyType} from "../../vEngineLight/physics/ArcadePhysics";
import {AnimationStateMachine} from "../../vEngineLight/animation/stateMachine/AnimationStateMachine";
import {HeroIdleState} from "./states/HeroIdleState";
import {HeroLookUpState} from "./states/HeroLookUpState";
import {HeroWalkState} from "./states/HeroWalkState";
import {HeroFallState} from "./states/HeroFallState";
import {HeroSitState} from "./states/HeroSitState";
import {HeroAttackState} from "./states/HeroAttackState";
import {HeroFireState} from "./states/HeroFireState";
import {Sprite} from "../../vEngineLight/gameObject/Sprite";

export class HeroGameObject extends Sprite {

    public readonly walkVelocity = 100;
    public readonly walkAnimation:FrameAnimation;
    public readonly idleAnimation:FrameAnimation;
    public readonly lookUpAnimation:FrameAnimation;
    public readonly fallAnimation:FrameAnimation;
    public readonly sitAnimation:FrameAnimation;
    public readonly attackAnimation:FrameAnimation;
    public readonly fireAnimation:FrameAnimation;

    public readonly animationPlayer = new FrameAnimationPlayer();
    public readonly animationStateMachine = new AnimationStateMachine(this.animationPlayer);

    private readonly bodyRef: ArcadeRigidBody;
    private readonly regularBodyRect: IFrame = {x: 25, y: 2, width: 15, height: 62};

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
                1600,
            );
        this.fallAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_fall1','hero_fall2']),
                800
            );
        this.sitAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_sit_down1','hero_sit_down2']),
                1500
            );
        this.lookUpAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_look-up1','hero_look-up2']),
                1600
            );
        this.attackAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_attack1','hero_attack2','hero_attack3','hero_attack4']),
                500, 1
            );
        this.fireAnimation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_fire1','hero_fire2']),
                450, 1
            );

        this.animationStateMachine.addStates(
            new HeroIdleState(this.scene, this), new HeroLookUpState(this.scene, this), new HeroWalkState(this.scene, this),
            new HeroFallState(this.scene, this), new HeroSitState(this.scene, this), new HeroAttackState(this.scene, this),
            new HeroFireState(this.scene, this),
        )
        this.animationStateMachine.setInitialState(HeroIdleState.name);
    }

    public override update(dt:number) {
        super.update(dt);
        this.animationPlayer.update(dt);
        this.animationStateMachine.update(dt);
    }

    public getRigidBody() {
        return this.bodyRef;
    }




}
