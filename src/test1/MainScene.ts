import {Scene} from "../vEngineLight/application/Scene";
import {GLUtils} from "../vEngineLight/utils/GLUtils";
import {TileMap} from "../vEngineLight/gameObject/TileMap";
import {AnimatedGameObject} from "./AnimatedGameObject";
import {Particle} from "./Particle";
import {Rectangle} from "../vEngineLight/gameObject/shapes/Rectangle";
import {Ellipse} from "../vEngineLight/gameObject/shapes/Ellipse";
import {KeyboardKey} from "../vEngineLight/inputControl/KeyboardKey";

export class MainScene extends Scene {

    private delta = 1;
    private hero: AnimatedGameObject;

    override onPreloadStarted() {
        this.app.assetManager
            .setBaseUrl('./src/test1/')
            .add('lava', 'image', 'assets/lava.png')
            .add('tileset', 'image', 'assets/tiles2.png')
            .add('cat', 'image', 'assets/hero.png')
    }

    override onProgress(percents: number) {
        console.log(percents);
    }

    override onReady() {
        super.onReady();
        const lava = this.app.assetManager.getImage('lava');
        const lavaTexture = GLUtils.createTextureFromImage(lava);
        const tileMapImage = this.app.assetManager.getImage('tileset');
        const tileMapTexture = GLUtils.createTextureFromImage(tileMapImage);

        const tilemap = new TileMap(
            this,
            [ // map data
                1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
                1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
                1, 0, 0, 2, 3, 4, 0, 0, 0, 1,
                1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            ],
            10, // map width in tiles
            12,  // tileset columns
            13,  // tileset rows
            tileMapTexture
        );
        // Рухаємо всю карту трохи вбік
        tilemap.position.xy(150, 50);

        const NUM_SPRITES = 1000;
        for (let i = 0; i < NUM_SPRITES; i++) {
            const p = new Particle(this,lavaTexture);
            this.addObject(p);
        }

        this.addObject(tilemap);

        const r = new Rectangle(this);
        r.color.rgba(255,0,0,255);
        r.size.wh(150,150);
        r.position.xy(120,60);
        this.addObject(r);

        const ellipse = new Ellipse(this,26,12);
        ellipse.position.xy(120,120);
        ellipse.color.rgb(0,0,255);
        this.addObject(ellipse);

        const catTexture = GLUtils.createTextureFromImage(this.app.assetManager.getImage('cat'));
        const animatedCat = new AnimatedGameObject(this,catTexture);
        this.addObject(animatedCat);
        this.hero = animatedCat;

    }

    override onUpdate(dt: number) {
        super.onUpdate(dt);
        // Рухаємо камеру для скролінгу
        // this.app.camera.transform.position.x += this.delta;
        if (this.app.camera.transform.position.x > 800 || this.app.camera.transform.position.x < -100) {
            this.delta*=-1;
        }
        if (this.input.keyboard.isPressed(KeyboardKey.UP)) {
            this.hero.position.y-=1;
        }
        if (this.input.keyboard.isPressed(KeyboardKey.DOWN)) {
            this.hero.position.y+=1;
        }
        if (this.input.keyboard.isPressed(KeyboardKey.LEFT)) {
            this.hero.position.x-=1;
        }
        if (this.input.keyboard.isPressed(KeyboardKey.RIGHT)) {
            this.hero.position.x+=1;
        }
    }
}
