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
import {rigidBodyGroup, particleGroup, bulletGroup, heroBodyGroup} from "../MainScene";
import {Rectangle} from "@vEngineLite/gameObject/shapes/Rectangle";
import {CollisionGroupManager} from "@vEngineLite/physics/CollisionGroupManager";

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
            collisionGroup: CollisionGroupManager.combine(rigidBodyGroup, heroBodyGroup),
            collideWithGroup: rigidBodyGroup,
            //ignoreCollisionWithGroup: particleGroup,
            //restitution: 0.2,
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

    public shoot() {
        const bullet = new Rectangle(this.scene);
        bullet.size.wh(5);
        bullet.color.fromCssColor('#8a0101');
        const bulletBody = this.scene.app.physics.createRigidBody({
            type: ArcadeRigidBodyType.DYNAMIC,
            target: bullet,
            collisionGroup: CollisionGroupManager.combine(rigidBodyGroup, bulletGroup),
            collideWithGroup: rigidBodyGroup,
            ignoreCollisionWithGroup: CollisionGroupManager.combine(particleGroup, heroBodyGroup),
            restitution: 0.1,
            mass: 0.001,
            gravityFactor: 0.3,
        });
        bulletBody.velocity.x = Math.sign(this.scale.x) * 500;
        bullet.body = bulletBody;
        bullet.position.y = this.position.y + this.regularBodyRect.y + 28;
        if (this.scale.x>0) {
            bullet.position.x = this.position.x + this.regularBodyRect.x;
        }
        else {
            bullet.position.x = this.position.x + this.regularBodyRect.x;
        }
        this.scene.insertBefore(bullet,this);
        bulletBody.onCollided = _=>{
            bulletBody.gravityFactor = 1;
            bullet.color.fromCssColor('#300101');
        }
        setTimeout(()=>{
            this.scene.removeObject(bullet);
        },5000);
    }




}
