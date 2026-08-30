import {Scene} from "../vEngineLight/application/Scene";
import {AnimatedGameObject} from "./AnimatedGameObject";
import {GLUtils} from "../vEngineLight/utils/GLUtils";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Rectangle} from "../vEngineLight/gameObject/shapes/Rectangle";
import {KeyboardKey} from "../vEngineLight/inputControl/KeyboardKey";
import {MathEx} from "../vEngineLight/utils/MathEx";
import {ArcadeRigidBody, ArcadeRigidBodyType} from "../vEngineLight/physics/ArcadePhysics";

export class TestCharacterScene extends Scene {
    private hero: AnimatedGameObject;

    override onPreloadStarted() {
        this.app.assetManager
            .setBaseUrl('./src/test1/')
            .add('lava', 'image', 'assets/lava.png')
            .add('tileset', 'image', 'assets/tiles2.png')
            .add('cat', 'image', 'assets/hero.png')
    }

    override onReady() {
        const catTexture = GLUtils.createTextureFromImage(this.app.assetManager.getImage('cat'));
        const animatedCat = new AnimatedGameObject(this,catTexture);
        this.addObject(animatedCat);
        animatedCat.body = this.app.physics.createRigidBody({
            type: ArcadeRigidBodyType.DYNAMIC,
            position: animatedCat.position,
            size: animatedCat.size,
        });
        this.hero = animatedCat;

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(400,50);
            platform.position.xy(100,450);
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                type: ArcadeRigidBodyType.STATIC,
                position: platform.position,
                size: platform.size,
            });
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,50);
            platform.position.xy(230,250);
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                position: platform.position,
                size: platform.size,
                type: ArcadeRigidBodyType.DYNAMIC,
            });
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(310,210);
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                position: platform.position,
                size: platform.size,
                type: ArcadeRigidBodyType.DYNAMIC,
            });
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(310,210);
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                position: platform.position,
                size: platform.size,
                type: ArcadeRigidBodyType.KINEMATIC,
                velocity: new Vector2(10,0),
            });
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(90,210);
            platform.color.rgb(0,233,0);
            platform.body = this.app.physics.createRigidBody({
                position: platform.position,
                size: platform.size,
                type: ArcadeRigidBodyType.KINEMATIC,
                velocity: new Vector2(0,-10),
            });
        }

        this.input.keyboard.onKeyDown(KeyboardKey.Z, ()=>{
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(MathEx.randomInt(800),MathEx.randomInt(50));
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                position: platform.position,
                size: platform.size,
                type: ArcadeRigidBodyType.DYNAMIC,
            });
        });
    }


    override onUpdate(dt: number) {
        super.onUpdate(dt);

        const heroRigidBody = this.hero.body as ArcadeRigidBody;
        if (this.input.keyboard.isPressed(KeyboardKey.RIGHT)) {
            heroRigidBody.velocity.x=100;
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.RIGHT)) {
            heroRigidBody.velocity.x = 0;
        }

        if (this.input.keyboard.isPressed(KeyboardKey.LEFT)) {
            heroRigidBody.velocity.x=-100;
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.LEFT)) {
            heroRigidBody.velocity.x = 0;
        }

        if (
            this.input.keyboard.isPressed(KeyboardKey.SPACE) &&
            heroRigidBody.onGround()
        ) {
            heroRigidBody.jump(-350);
        }

    }
}
