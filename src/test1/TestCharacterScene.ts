import {Scene} from "../vEngineLight/application/Scene";
import {AnimatedGameObject} from "./AnimatedGameObject";
import {GLUtils} from "../vEngineLight/utils/GLUtils";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Rectangle} from "../vEngineLight/gameObject/shapes/Rectangle";

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
            static: false,
            velocity: new Vector2()
        };
        this.hero = animatedCat;


        const platform = new Rectangle(this);
        this.addObject(platform);
        platform.size.wh(400,50);
        platform.position.xy(100,450);
        platform.color.rgb(120,0,0);
        platform.body = {
            position: platform.position,
            size: platform.size,
            static: true,
            velocity: new Vector2()
        }

    }

}
