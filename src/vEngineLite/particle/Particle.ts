import {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";

export class Particle {

    public active = false;
    public target: RenderableContainer;

    reset(): void {
        this.active = false;
    }
}
