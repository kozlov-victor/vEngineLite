import {AbstractScaleStrategy} from "./AbstractScaleStrategy";
import {VEngineLiteApplication} from "../../application/VEngineLiteApplication";
import {ScaleHelper} from "./ScaleHelper";

export class ScaleStrategyFitCanvasToScreen extends AbstractScaleStrategy {

    public override onResize(app: VEngineLiteApplication, container:HTMLCanvasElement): void {

        const screenResolution = this.getScreenResolution();

        const metrics =
            ScaleHelper.calcMetrixToFitRectToWindow(app.size,screenResolution);

        // game.scale.setFrom(metrics.scale);
        // game.pos.setFrom(metrics.pos);

        container.width = metrics.size.w;
        container.height = metrics.size.h;
        container.style.width = metrics.size.w + 'px';
        container.style.height = metrics.size.h + 'px';
        container.style.margin = `${metrics.pos.y}px auto`;

        app.viewPort.from(metrics.size);
    }

}
