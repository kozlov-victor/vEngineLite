import {ObjectPool} from "@vEngineLite/utils/ObjectPool";
import {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";
import {Particle} from "@vEngineLite/particle/Particle";
import {Scene} from "@vEngineLite/application/Scene";
import {MathEx} from "@vEngineLite/utils/MathEx";
import {Container} from "@vEngineLite/gameObject/base/Container";
import {TriangleBatchRenderer} from "@vEngineLite/rendering/TriangleBatchRenderer";

export interface ValueRange {
    from: number;
    to: number;
}

export interface ParticleEmitterParameters {
    capacity: number;
    factory:()=>RenderableContainer;
    angle?: ValueRange;
    velocity?: ValueRange;
    lifetime?: ValueRange;
    amount?: ValueRange;
    emissionRadius?: ValueRange;
}

interface ParticleEmitterParametersNormalized {
    angle: ValueRange;
    velocity: ValueRange;
    lifetime: ValueRange;
    amount: ValueRange;
    emissionRadius: ValueRange;
}

export class ParticleEmitter extends Container {

    private readonly pool: ObjectPool<Particle>;
    private readonly params: ParticleEmitterParametersNormalized;
    private active = false;

    constructor(scene: Scene, parameters: ParticleEmitterParameters) {
        super(scene);
        const factory = ()=>{
            const p = new Particle();
            p.target = parameters.factory();
            return p;
        }
        this.pool = new ObjectPool<Particle>(parameters.capacity,factory);
        this.params = this.normalize(parameters);
    }

    private normalize(parameters: ParticleEmitterParameters) {
        const params: ParticleEmitterParametersNormalized = {
            angle: parameters.angle ?? {from: 0, to: Math.PI*2},
            velocity: parameters.velocity ?? {from: 10, to: 100},
            lifetime: parameters.lifetime ?? {from: 1000, to: 3000},
            amount: parameters.amount ?? {from: 1, to: 10},
            emissionRadius: parameters.emissionRadius ?? {from: 0, to: 10},
        }
        if (params.angle.to<params.angle.from) params.angle.to += 2*Math.PI;
        return params;
    }

    private rnd(range: ValueRange) {
        return MathEx.randomInt(range.from, range.to);
    }

    public emitAt(x:number, y: number) {
        const amount = this.rnd(this.params.amount);
        for (let i = 0; i < amount; i++) {
            const particle = this.pool.acquire();
            if (!particle) return;

            this.active = true;
            const emissionRadius = this.rnd(this.params.emissionRadius);
            const angle = MathEx.randomInt(0,Math.PI*2);
            particle.target.position.x = emissionRadius*Math.cos(angle) + x;
            particle.target.position.y = emissionRadius*Math.sin(angle) + y;
            if (particle.target.body) {
                const velocityX = this.rnd(this.params.velocity);
                const velocityY = this.rnd(this.params.velocity);
                particle.target.body.velocity.x = velocityX;
                particle.target.body.velocity.y = velocityY;
            }

            particle.active = true;
            particle.time = 0;
            particle.lifetime = this.rnd(this.params.lifetime);
        }
    }

    public override update(dt: number) {
        if (!this.active) return;
        this.active = false;
        for (const particle of this.pool.getAll()) {
            if (!particle.active) continue;
            this.active = true;
            particle.time+=dt;
            particle.target.update(dt);
            if (particle.time > particle.lifetime) {
                particle.active = false;
                this.pool.release(particle);
            }
        }
    }

    override enterFrame(renderer: TriangleBatchRenderer) {
        if (!this.active) return;
        for (const particle of this.pool.getAll()) {
            if (!particle.active) continue;
            particle.target.enterFrame(renderer);
        }
    }
}
