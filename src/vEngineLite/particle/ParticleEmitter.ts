import {ObjectPool} from "@vEngineLite/utils/ObjectPool";
import {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";
import {Particle} from "@vEngineLite/particle/Particle";

export interface ParticleEmitterParameters {
    capacity: number;
    factory:()=>RenderableContainer;
}

export class ParticleEmitter {

    private readonly pool: ObjectPool<Particle>;

    constructor(private parameters: ParticleEmitterParameters) {
        const factory = ()=>{
            const p = new Particle();
            p.active = true;
            p.target = parameters.factory();
            return p;
        }
        this.pool = new ObjectPool<Particle>(parameters.capacity,factory);
    }

}
