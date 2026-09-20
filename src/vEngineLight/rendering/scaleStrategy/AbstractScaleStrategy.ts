import {Size} from "../../utils/Size";
import {VEngineLiteApplication} from "../../application/VEngineLiteApplication";

export abstract class AbstractScaleStrategy {

    public abstract onResize(app: VEngineLiteApplication, container:HTMLCanvasElement):void;

    protected getScreenResolution() {
        return new Size(window.innerWidth,window.innerHeight);
    }

}
