import {AbstractScaleStrategy} from "./AbstractScaleStrategy";
import {VEngineLiteApplication} from "../../application/VEngineLiteApplication";

export class ScaleStrategyStretchCanvasToScreen extends AbstractScaleStrategy {

    public override onResize(app: VEngineLiteApplication, container:HTMLCanvasElement): void {
        const screenResolution = this.getScreenResolution();

        container.width = screenResolution.w;
        container.height = screenResolution.h;
        container.style.width = `${screenResolution.w}px`;
        container.style.height = `${screenResolution.h}px`;
        app.viewPort.from(screenResolution);
        //game.scale.setXY(innerWidth/game.size.width,innerHeight/game.size.height);
        //game.pos.setXY(0);
    }

}
