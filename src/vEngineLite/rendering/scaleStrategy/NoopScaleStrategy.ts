import {AbstractScaleStrategy} from "./AbstractScaleStrategy";
import {VEngineLiteApplication} from "../../application/VEngineLiteApplication";

export class NoopScaleStrategy extends AbstractScaleStrategy {

    onResize(app: VEngineLiteApplication, container: HTMLCanvasElement): void {
        app.viewPort.from(app.size);
    }

}
