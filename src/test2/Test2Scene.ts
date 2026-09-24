import {Scene} from "../vEngineLight/application/Scene";
import {GLUtils} from "../vEngineLight/utils/GLUtils";
import {TileMap} from "../vEngineLight/gameObject/TileMap";
import {Rectangle} from "../vEngineLight/gameObject/shapes/Rectangle";
import {Ellipse} from "../vEngineLight/gameObject/shapes/Ellipse";
import {ColorPerVertexRectangle} from "../vEngineLight/gameObject/shapes/ColorPerVertexRectangle";
import {Sprite} from "../vEngineLight/gameObject/Sprite";
import {Particle} from "./Particle";

export class Test2Scene extends Scene {

    override onPreloadStarted() {
        this.app.assetManager
            .setBaseUrl('../src/test2/')
            .add('lava', 'image', 'assets/lava.png')
            .add('tileset', 'image', 'assets/tiles2.png')
            .add('testImage', 'image', 'assets/testImage.png')
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

        const tileMap = new TileMap(
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
        tileMap.position.xy(150, 50);

        const NUM_SPRITES = 1000;
        for (let i = 0; i < NUM_SPRITES; i++) {
            const p = new Particle(this,lavaTexture);
            this.addObject(p);
        }

        this.addObject(tileMap);

        const r = new Rectangle(this);
        r.color.rgba(255,0,0,255);
        r.size.wh(150,150);
        r.position.xy(120,60);
        this.addObject(r);

        const ellipse = new Ellipse(this,26,12);
        ellipse.position.xy(120,120);
        ellipse.color.rgb(0,0,255);
        this.addObject(ellipse);

        const gradient = new ColorPerVertexRectangle(this);
        gradient.colorA.fromCssColor('#ac4949');
        gradient.colorB.fromCssColor('#ac4949');
        gradient.colorC.fromCssColor('#759c3b');
        gradient.colorD.fromCssColor('#759c3b');
        gradient.size.wh(200,30);
        gradient.position.xy(200,10);
        this.addObject(gradient);

        const testImage = new Sprite(this,GLUtils.createTextureFromImage(this.app.assetManager.getImage('testImage')));
        testImage.position.xy(150,200);
        testImage.size.wh(50,30);
        this.addObject(testImage);

    }
}
