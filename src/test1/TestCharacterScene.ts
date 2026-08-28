import {Scene} from "../vEngineLight/application/Scene";
import {AnimatedGameObject} from "./AnimatedGameObject";
import {GLUtils} from "../vEngineLight/utils/GLUtils";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Rectangle} from "../vEngineLight/gameObject/shapes/Rectangle";
import {KeyboardKey} from "../vEngineLight/inputControl/KeyboardKey";
import {MathEx} from "../vEngineLight/utils/MathEx";
import {BodyType} from "../vEngineLight/physics/ArcadePhysics";

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
        (window as any).hero = animatedCat;
        this.addObject(animatedCat);
        animatedCat.body = {
            position: animatedCat.position,
            size: animatedCat.size,
            type: BodyType.DYNAMIC,
            velocity: new Vector2(),
            mass: 1,
            frameMovement: new Vector2(),
        };
        this.hero = animatedCat;


        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(400,50);
            platform.position.xy(100,450);
            platform.color.rgb(120,0,0);
            platform.body = {
                position: platform.position,
                size: platform.size,
                type: BodyType.STATIC,
                mass: 1,
                velocity: new Vector2(),
                frameMovement: new Vector2(),
            }
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,50);
            platform.position.xy(230,250);
            platform.color.rgb(120,0,0);
            platform.body = {
                position: platform.position,
                size: platform.size,
                type: BodyType.DYNAMIC,
                mass: 1,
                velocity: new Vector2(),
                frameMovement: new Vector2(),
            };
            (platform.body as any).name = 'box';
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(310,210);
            platform.color.rgb(120,0,0);
            platform.body = {
                position: platform.position,
                size: platform.size,
                type: BodyType.DYNAMIC,
                velocity: new Vector2(),
                frameMovement: new Vector2(),
                mass: 1,
            }
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(310,210);
            platform.color.rgb(120,0,0);
            platform.body = {
                position: platform.position,
                size: platform.size,
                type: BodyType.KINEMATIC,
                velocity: new Vector2(10,0),
                mass: 1,
                frameMovement: new Vector2(),
            }
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(90,210);
            platform.color.rgb(0,233,0);
            platform.body = {
                position: platform.position,
                size: platform.size,
                type: BodyType.KINEMATIC,
                velocity: new Vector2(0,-10),
                mass: 1,
                frameMovement: new Vector2(),
            }
        }

        this.input.keyboard.onKeyDown(KeyboardKey.Z, ()=>{
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(MathEx.randomInt(300),MathEx.randomInt(50));
            platform.color.rgb(120,0,0);
            platform.body = {
                position: platform.position,
                size: platform.size,
                type: BodyType.DYNAMIC,
                velocity: new Vector2(),
                mass: 1,
                frameMovement: new Vector2(),
            }
        });

    }


    override onUpdate(dt: number) {
        super.onUpdate(dt);
        if (this.input.keyboard.justPressed(KeyboardKey.RIGHT)) {
            this.hero.body!.velocity.x+=100;
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.RIGHT)) {
            this.hero.body!.velocity.x = 0;
        }

        if (this.input.keyboard.justPressed(KeyboardKey.LEFT)) {
            this.hero.body!.velocity.x-=100;
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.LEFT)) {
            this.hero.body!.velocity.x = 0;
        }

        if (
            this.input.keyboard.isPressed(KeyboardKey.SPACE) &&
            this.hero.body!.support !== undefined
        ) {
            this.hero.body!.velocity.y = -350;
            this.hero.body!.support = undefined;
        }

    }
}
