import {VEngineLiteApplication} from "./vEngineLight/application/VEngineLiteApplication";
import {MainScene} from "./test1/MainScene";
import {TestCharacterScene} from "./test1/TestCharacterScene";
import {Size} from "./vEngineLight/utils/Size";
import {ScaleStrategyFitCanvasToScreen} from "./vEngineLight/rendering/scaleStrategy/ScaleStrategyFitCanvasToScreen";


const app =
    new VEngineLiteApplication(
        document.querySelector("#c") as HTMLCanvasElement,
        new Size(640, 480),
        //new ScaleStrategyFitCanvasToScreen()
    );
app.runScene(new TestCharacterScene(app));

const fpsElem = document.querySelector("#fps")!;
fpsElem.textContent = `-`;
setInterval(()=>{
    fpsElem.textContent = `${app.fpsCounter.getFps()} fps`;
},1000);
