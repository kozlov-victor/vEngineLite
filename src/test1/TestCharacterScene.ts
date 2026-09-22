import {Scene} from "../vEngineLight/application/Scene";
import {HeroGameObject} from "./hero/HeroGameObject";
import {GLUtils} from "../vEngineLight/utils/GLUtils";
import {Vector2} from "../vEngineLight/utils/Vector2";
import {Rectangle} from "../vEngineLight/gameObject/shapes/Rectangle";
import {KeyboardKey} from "../vEngineLight/inputControl/KeyboardKey";
import {MathEx} from "../vEngineLight/utils/MathEx";
import {ArcadeRigidBodyType} from "../vEngineLight/physics/ArcadePhysics";
import {SpriteSheet} from "../vEngineLight/types";
import {TileMaps} from "../vEngineLight/gameObject/TileMaps";
import {TileMap} from "../vEngineLight/gameObject/TileMap";
import {LookAheadFollowStrategy} from "../vEngineLight/camera/follow/LookAheadFollowStrategy";
import {VEngineLiteApplication} from "../vEngineLight/application/VEngineLiteApplication";
import {Font} from "../vEngineLight/gameObject/text/Font";
import {TextLabel} from "../vEngineLight/gameObject/text/TextLabel";

export class TestCharacterScene extends Scene {

    private hero: HeroGameObject;
    private cameraFollowStrategy = new LookAheadFollowStrategy(
        100,
        6,
        4
    );


    constructor(app: VEngineLiteApplication) {
        super(app);
        this.bgColor.rgb(122,122,122);
    }

    override onPreloadStarted() {
        this.app.assetManager
            .setBaseUrl('../src/test1/')
            .add('tileset', 'image', 'assets/tiles.png')
            .add('tilemap', 'json', 'assets/map.json')
            .add('cat', 'image', 'assets/hero.png')
            .add('cat-sprite-sheet', 'json', 'assets/hero.json');
    }

    override onProgress(percents: number) {
        super.onProgress(percents);
        console.log(percents);
    }

    override onReady() {
        const catTexture = GLUtils.createTextureFromImage(this.app.assetManager.getImage('cat'));
        const catSpriteSheet: SpriteSheet = this.app.assetManager.getJson('cat-sprite-sheet');
        const animatedCat = new HeroGameObject(this,catTexture,catSpriteSheet);
        this.addObject(animatedCat);

        this.app.camera.followTarget = animatedCat;
        this.app.camera.followStrategy = this.cameraFollowStrategy;

        this.hero = animatedCat;

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(400,50);
            platform.position.xy(100,450);
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                type: ArcadeRigidBodyType.STATIC,
                target: platform,
            });
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,50);
            platform.position.xy(230,250);
            platform.color.rgb(120,0,0);
            platform.body = this.app.physics.createRigidBody({
                target: platform,
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
                target: platform,
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
                target: platform,
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
                target: platform,
                type: ArcadeRigidBodyType.KINEMATIC,
                velocity: new Vector2(0,-10),
            });
        }

        {
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(100,200);
            platform.color.rgb(0,233,0);
            platform.body = this.app.physics.createRigidBody({
                target: platform,
                type: ArcadeRigidBodyType.KINEMATIC,
                velocity: new Vector2(0,10),
            });
        }

        const tileTexture = GLUtils.createTextureFromImage(this.app.assetManager.getImage('tileset'));
        const tiledData = TileMaps.fromTiledTileMap(
            this.app.assetManager.getJson('tilemap'),
            'Tile Layer 1','tiles'
        );
        const tileMap = new TileMap(
            this,tiledData.data,tiledData.mapWidthInTiles,
            tiledData.tilesetCols,tiledData.tilesetRows,
            tileTexture
        );
        this.addObject(tileMap);

        {

            const rect = new Rectangle(this);
            this.addObject(rect);
            rect.size.wh(400,250);
            rect.position.xy(200,200);
            rect.color.fromCssColor('#8f8f8f33');
            this.addObject(rect);

            const font = Font.fromCss({fontFamily:'Arial',fontSize: 25, additionalChars: '😍💁👌🎍'});
            const textLabel = new TextLabel(this,font);
            textLabel.setText(
                '😍Hello World\n💁👌це 🎍демо\nтекст! Нам дуже подобається оце от все. Перевірка вирівнювання тесту. Тут довгий тест новий. І ще слово одне'
            );
            const parameters = textLabel.getTextParameters();
            parameters.wrap = true;
            parameters.textAlign = 'justify';
            parameters.verticalAlign = 'center';
            textLabel.setTextParameters(parameters);
            textLabel.position.from(rect.position);
            textLabel.size.from(rect.size);
            textLabel.color.fromCssColor('#45D800');
            this.addObject(textLabel);
        }

        this.calculateBounds();

        this.input.keyboard.onKeyDown(KeyboardKey.X, ()=>{
            const platform = new Rectangle(this);
            this.addObject(platform);
            platform.size.wh(50,30);
            platform.position.xy(MathEx.randomInt(0,this.size.w),MathEx.randomInt(0,50));
            platform.color.rgba(MathEx.randomInt(100,255),MathEx.randomInt(100,255),MathEx.randomInt(100,255),MathEx.randomInt(100,255));
            platform.body = this.app.physics.createRigidBody({
                target: platform,
                type: ArcadeRigidBodyType.DYNAMIC,
            });
        });
    }


    override onUpdate(dt: number) {
        super.onUpdate(dt);

        if (!this.hero) return;
        if (this.input.keyboard.isPressed(KeyboardKey.RIGHT)) {
            this.hero.scale.x = 1;
            this.hero.pivot.x = 0;
            const accepted = this.hero.animationStateMachine.sendCommand('walk');
            if (accepted) {
                this.cameraFollowStrategy.lookDirectionX = 'right';
                this.cameraFollowStrategy.lookDirectionY = 'none';
            }
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.RIGHT)) {
            this.hero.animationStateMachine.sendCommand('stop');
            this.hero.getRigidBody().velocity.x = 0;
        }

        if (this.input.keyboard.isPressed(KeyboardKey.LEFT)) {
            this.hero.scale.x = -1;
            this.hero.pivot.x = 64;
            const accepted = this.hero.animationStateMachine.sendCommand('walk');
            if (accepted) {
                this.cameraFollowStrategy.lookDirectionX = 'left';
                this.cameraFollowStrategy.lookDirectionY = 'none';
            }
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.LEFT)) {
            this.hero.animationStateMachine.sendCommand('stop');
            this.hero.getRigidBody().velocity.x = 0;
        }

        if (this.input.keyboard.isPressed(KeyboardKey.DOWN)) {
            const accepted = this.hero.animationStateMachine.sendCommand('sit');
            if (accepted) {
                this.cameraFollowStrategy.lookDirectionY = 'bottom';
            }
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.DOWN)) {
            const accepted = this.hero.animationStateMachine.sendCommand('stopSit');
            if (accepted) {
                this.cameraFollowStrategy.lookDirectionY = 'none';
            }
        }

        if (this.input.keyboard.isPressed(KeyboardKey.UP)) {
            const accepted = this.hero.animationStateMachine.sendCommand('lookUp');
            if (accepted) {
                this.cameraFollowStrategy.lookDirectionY = 'top';
            }
        }
        else if (this.input.keyboard.justReleased(KeyboardKey.UP)) {
            const accepted = this.hero.animationStateMachine.sendCommand('stopLookUp');
            if (accepted) {
                this.cameraFollowStrategy.lookDirectionY = 'none';
            }
        }

        if (this.input.keyboard.isPressed(KeyboardKey.Z)) {
            this.hero.animationStateMachine.sendCommand('attack');
        }
        if (this.input.keyboard.isPressed(KeyboardKey.A)) {
            const accepted = this.hero.animationStateMachine.sendCommand('fire');
        }

        if (
            this.input.keyboard.isPressed(KeyboardKey.SPACE) &&
            this.hero.getRigidBody().onGround()
        ) {
            this.hero.getRigidBody().jump(-350);
        }

        if (this.hero.getRigidBody().onGround()) {
            this.hero.animationStateMachine.sendCommand('ground');
        }
        else {
            this.hero.animationStateMachine.sendCommand('unground');
        }

    }
}
