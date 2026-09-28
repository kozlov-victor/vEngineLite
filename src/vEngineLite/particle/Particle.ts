import {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";

export class Particle {

    public target: RenderableContainer;
    public lifetime: number;

    public active: boolean;
    public time = 0;
}
