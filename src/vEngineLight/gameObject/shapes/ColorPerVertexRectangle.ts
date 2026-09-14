import {RenderableContainer} from "../base/RenderableContainer";
import {TriangleBatchRenderer} from "../../rendering/TriangleBatchRenderer";
import {Triangle, Vertex} from "../../types";
import {Scene} from "../../application/Scene";
import {Texture} from "../../rendering/Texture";
import {GLUtils} from "../../utils/GLUtils";
import {Color} from "../../rendering/Color";

export class ColorPerVertexRectangle extends RenderableContainer {

    public readonly colorA = Color.BLACK();
    public readonly colorB = Color.BLACK();
    public readonly colorC = Color.BLACK();
    public readonly colorD = Color.BLACK();

    private readonly texture: Texture;

    private readonly a: Vertex = {
        position: [0,0],
        textCoord: [0,0],
        colorTint: this.colorA.getNormalized()
    }

    private readonly b: Vertex = {
        position: [0,0],
        textCoord: [0,0],
        colorTint: this.colorB.getNormalized()
    }

    private readonly c: Vertex = {
        position: [0,0],
        textCoord: [0,0],
        colorTint: this.colorC.getNormalized()
    }

    private readonly d: Vertex = {
        position: [0,0],
        textCoord: [0,0],
        colorTint: this.colorD.getNormalized()
    }

    private readonly triangle1:Triangle = {
        v1: this.a,
        v2: this.b,
        v3: this.d
    }

    private readonly triangle2:Triangle = {
        v1: this.b,
        v2: this.c,
        v3: this.d
    }

    constructor(scene: Scene) {
        super(scene);
        this.texture = GLUtils.getEmptyTexture();
    }

    render(renderer: TriangleBatchRenderer): void {

        this.b.position[0] = this.size.w;
        this.c.position[0] = this.size.w;
        this.c.position[1] = this.size.w;
        this.d.position[1] = this.size.h;

        renderer.batchTriangle(this.triangle1, this.texture, this.getWorldMatrix());
        renderer.batchTriangle(this.triangle2, this.texture, this.getWorldMatrix());
    }

}
