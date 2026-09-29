import {Texture} from "@vEngineLite/rendering/Texture";
import {FrameAnimation} from "@vEngineLite/animation/FrameAnimation";
import {FrameAnimationPlayer} from "@vEngineLite/animation/FrameAnimationPlayer";
import {Scene} from "@vEngineLite/application/Scene";
import {IFrame, SpriteSheet} from "@vEngineLite/types";
import {ArcadeRigidBody, ArcadeRigidBodyType} from "@vEngineLite/physics/ArcadePhysics";
import {AnimationStateMachine} from "@vEngineLite/animation/stateMachine/AnimationStateMachine";
import {HeroIdleState} from "./states/HeroIdleState";
import {HeroLookUpState} from "./states/HeroLookUpState";
import {HeroWalkState} from "./states/HeroWalkState";
import {HeroFallState} from "./states/HeroFallState";
import {HeroSitState} from "./states/HeroSitState";
import {HeroAttack1State} from "./states/HeroAttack1State";
import {HeroFireState} from "./states/HeroFireState";
import {Sprite} from "@vEngineLite/gameObject/Sprite";
import {HeroAttack2State} from "./states/HeroAttack2State";
import {groundGroup, particleGroup} from "../MainScene";

export class HeroGameObject extends Sprite {

    public readonly walkVelocity = 100;
    public readonly walkAnimation:FrameAnimation;
    public readonly idleAnimation:FrameAnimation;
    public readonly lookUpAnimation:FrameAnimation;
    public readonly fallAnimation:FrameAnimation;
    public readonly sitAnimation:FrameAnimation;
    public readonly attack1Animation:FrameAnimation;
    public readonly attack2Animation:FrameAnimation;
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
            rect: this.regularBodyRect,
            collisionGroup: groundGroup,
            collideWithGroup: groundGroup,
            ignoreCollisionWithGroup: particleGroup,
            restitution: 0.2,
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
        this.attack1Animation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_attack1','hero_attack2']),
                500, 1
            );
        this.attack2Animation =
            new FrameAnimation(
                this,
                FrameAnimation.spriteSheetFramesByName(spriteSheet,['hero_attack3','hero_attack4']),
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
            new HeroFallState(this.scene, this), new HeroSitState(this.scene, this),
            new HeroAttack1State(this.scene, this), new HeroAttack2State(this.scene, this),
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
