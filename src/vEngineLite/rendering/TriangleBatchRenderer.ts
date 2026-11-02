import {GLUtils} from "../utils/GLUtils";
import {Size} from "../utils/Size";
import {Texture} from "./Texture";
import {TextureInfo} from "../components/TextureInfo";
import {Triangle, Vertex} from "../types";
import {Mat2d} from "../utils/Mat2d";
import {Color} from "./Color";
import {VEngineLiteApplication} from "../application/VEngineLiteApplication";
import {RenderableContainer} from "@vEngineLite/gameObject/base/RenderableContainer";


export class TriangleBatchRenderer {

    private static readonly TRIANGLES_IN_BATCH = 8192;
    private static readonly VERTICES_IN_TRIANGLE = 3;
    private static readonly VEC2_SIZE = 2;
    private static readonly VEC4_SIZE = 4;
    private static readonly ATTRIBUTE_ELEMENTS_PER_VERTEX =
        this.VEC2_SIZE + this.VEC2_SIZE + this.VEC4_SIZE; // vec2 a_position + vec2 a_texCoord + vec4 a_colorTint

    private currentTriangle = 0;
    private readonly vertexData: Float32Array;

    private program: WebGLProgram;
    private positionAttributeLocation: GLint;
    private texCoordAttributeLocation: GLint;
    private colorTintAttributeLocation: GLint;
    private viewProjectionUniformLocation: WebGLUniformLocation;
    private textureSizeUniformLocation: WebGLUniformLocation;

    private currentTexture: Texture;
    private vertexBuffer: WebGLBuffer;

    private readonly projMatrix = new Mat2d();
    private readonly viewMatrix = new Mat2d();
    private readonly viewProjMatrix = new Mat2d();
    private readonly triangle: Triangle = {
        v1: {position: [0,0],textCoord: [0,0],colorTint:[0,0,0,0],transformedPosition: [0,0]},
        v2: {position: [0,0],textCoord: [0,0],colorTint:[0,0,0,0],transformedPosition: [0,0]},
        v3: {position: [0,0],textCoord: [0,0],colorTint:[0,0,0,0],transformedPosition: [0,0]},
    };
    private readonly viewProjMatrixValues = new Float32Array(9);

    private readonly _interactiveRenderedStack: RenderableContainer[] = [];

    constructor(private readonly app: VEngineLiteApplication) {
        this.vertexData = new Float32Array(
            TriangleBatchRenderer.TRIANGLES_IN_BATCH *
            TriangleBatchRenderer.VERTICES_IN_TRIANGLE *
            TriangleBatchRenderer.ATTRIBUTE_ELEMENTS_PER_VERTEX
        );
        this.createProgram();
        this.findAttributeAndUniformLocations();
        this.createVertexBuffer();
        this.updateProjectionMatrix();
    }

    private createProgram() {
        //language=GLSL
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            attribute vec4 a_colorTint;

            uniform mat3 u_viewProjection;
            uniform vec2 u_textureSize;

            varying vec2 v_texCoord;
            varying vec4 v_colorTint;

            void main() {
                // Множимо світові координати на матрицю виду-проекції
                vec3 pos = u_viewProjection * vec3(a_position, 1.0);
                gl_Position = vec4(pos.xy, 0.0, 1.0);
                v_texCoord = a_texCoord / u_textureSize;
                v_colorTint = a_colorTint;
            }
        `;
        //language=GLSL
        const fragmentShaderSource = `
            precision mediump float;
            varying vec2 v_texCoord;
            varying vec4 v_colorTint;

            uniform sampler2D u_image;

            void main() {
                vec4 texColor = texture2D(u_image, v_texCoord);
                gl_FragColor = vec4(
                    texColor.rgb * v_colorTint.rgb * v_colorTint.a,
                    texColor.a * v_colorTint.a
                );
            }
        `;

        const gl = GLUtils.getContext();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        const vertexShader = GLUtils.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = GLUtils.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = GLUtils.createProgram(vertexShader, fragmentShader);
    }

    private findAttributeAndUniformLocations() {
        const gl = GLUtils.getContext();
        this.positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        this.texCoordAttributeLocation = gl.getAttribLocation(this.program, "a_texCoord");
        this.colorTintAttributeLocation = gl.getAttribLocation(this.program, "a_colorTint");
        this.viewProjectionUniformLocation = gl.getUniformLocation(this.program, "u_viewProjection")!;
        this.textureSizeUniformLocation = gl.getUniformLocation(this.program, "u_textureSize")!;
    }

    private createVertexBuffer() {
        const gl = GLUtils.getContext();
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            throw new Error(`failed to create vertex buffer`);
        }
        this.vertexBuffer = vertexBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);
    }

    private updateProjectionMatrix() {
        Mat2d.projection(this.app.size.w, this.app.size.h, this.projMatrix);
    }

    public bind() {
        const gl = GLUtils.getContext();
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        const float32Size = 4;
        const stride = TriangleBatchRenderer.ATTRIBUTE_ELEMENTS_PER_VERTEX * float32Size;

        const v2 = TriangleBatchRenderer.VEC2_SIZE;
        const v4 = TriangleBatchRenderer.VEC4_SIZE;
        let offset = 0;

        gl.enableVertexAttribArray(this.positionAttributeLocation);
        gl.vertexAttribPointer(this.positionAttributeLocation, v2, gl.FLOAT, false, stride, offset * float32Size);
        offset += v2;

        gl.enableVertexAttribArray(this.texCoordAttributeLocation);
        gl.vertexAttribPointer(this.texCoordAttributeLocation, v2, gl.FLOAT, false, stride, offset * float32Size);
        offset += v2;

        gl.enableVertexAttribArray(this.colorTintAttributeLocation);
        gl.vertexAttribPointer(this.colorTintAttributeLocation, v4, gl.FLOAT, false, stride, offset * float32Size);
    }

    private batchVertex(v: Vertex, i: number) {
        const vData = this.vertexData;
        vData[i] = v.transformedPosition[0]; vData[i + 1] = v.transformedPosition[1]; vData[i + 2] = v.textCoord[0]; vData[i + 3] = v.textCoord[1];
        vData[i + 4] = v.colorTint[0]; vData[i + 5] = v.colorTint[1]; vData[i + 6] = v.colorTint[2]; vData[i + 7] = v.colorTint[3];
    }

    public batchTriangle(triangle: Triangle, texture:Texture, worldMatrix: Mat2d) {

        if (this.currentTriangle===TriangleBatchRenderer.TRIANGLES_IN_BATCH) {
            this.flush();
        }

        if (this.currentTexture === undefined) this.currentTexture = texture;
        if (this.currentTexture !== texture) {
            this.flush();
            this.currentTexture = texture;
        }

        let i = this.currentTriangle * TriangleBatchRenderer.VERTICES_IN_TRIANGLE * TriangleBatchRenderer.ATTRIBUTE_ELEMENTS_PER_VERTEX;
        const size = TriangleBatchRenderer.ATTRIBUTE_ELEMENTS_PER_VERTEX;

        worldMatrix.transformPoint(triangle.v1.position, triangle.v1.transformedPosition);
        worldMatrix.transformPoint(triangle.v2.position, triangle.v2.transformedPosition);
        worldMatrix.transformPoint(triangle.v3.position, triangle.v3.transformedPosition);

        this.batchVertex(triangle.v1, i);
        this.batchVertex(triangle.v2, i+size);
        this.batchVertex(triangle.v3, i+size*2);

        this.currentTriangle++;
    }

    public batchSprite(size: Size, textureInfo: TextureInfo, worldMatrix: Mat2d, target: RenderableContainer|undefined, x = 0, y = 0) {

        const uv = textureInfo.rect.uv;
        const objWidth = size.w, objHeight = size.h;

        const
            texFrameWidth = textureInfo.rect.size.w,
            texFrameHeight = textureInfo.rect.size.h;

        const u = uv.x, v = uv.y;
        const colNorm = textureInfo.color.getNormalized();

        const t = this.triangle;


        /*
        v1-----v2
        |    *
        |  *
        v3*
         */

        // triangle 1
        // v1
        t.v1.position[0] = x;
        t.v1.position[1] = y;
        t.v1.textCoord[0] = u;
        t.v1.textCoord[1] = v;
        t.v1.colorTint = colNorm;
        worldMatrix.transformPoint(t.v1.position, t.v1.transformedPosition);
        // v2
        t.v2.position[0] = x + objWidth;
        t.v2.position[1] = y;
        t.v2.textCoord[0] = u + texFrameWidth;
        t.v2.textCoord[1] = v;
        t.v2.colorTint = colNorm;
        worldMatrix.transformPoint(t.v2.position, t.v2.transformedPosition);
        // v3
        t.v3.position[0] = x;
        t.v3.position[1] = y + objHeight;
        t.v3.textCoord[0] = u;
        t.v3.textCoord[1] = v + texFrameHeight;
        t.v3.colorTint = colNorm;
        worldMatrix.transformPoint(t.v3.position, t.v3.transformedPosition);
        this.batchTriangle(t,textureInfo.texture,worldMatrix);
        if (target && target.interactive && target.pointerHitArea) {
            target.pointerHitArea.updateHitPoint(1, t.v1.transformedPosition);
            target.pointerHitArea.updateHitPoint(2, t.v2.transformedPosition);
            target.pointerHitArea.updateHitPoint(3, t.v3.transformedPosition);
        }

        /*
              v2|
             *  |
           *    |
        v3*----v1
        */

        // triangle 2
        // v1
        t.v1.position[0] = x + objWidth;
        t.v1.position[1] = y + objHeight;
        t.v1.textCoord[0] = u + texFrameWidth;
        t.v1.textCoord[1] = v + texFrameHeight;
        //t.v1.colorTint = colNorm;
        worldMatrix.transformPoint(t.v1.position, t.v1.transformedPosition);
        // інші вершини вже були трансформовані, тому не потрібно повторно викликати transformPoint для них
        this.batchTriangle(t,textureInfo.texture,worldMatrix);
        if (target && target.interactive && target.pointerHitArea) {
            target.pointerHitArea.updateHitPoint(4, t.v1.transformedPosition);
            this._interactiveRenderedStack.push(target);
        }
    }

    public clear(color: Color) {
        const gl = GLUtils.getContext();
        const normColor = color.getNormalized();
        gl.viewport(0, 0, this.app.viewPort.w, this.app.viewPort.h);
        gl.clearColor(normColor[0], normColor[1], normColor[2], normColor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this._interactiveRenderedStack.length = 0;
    }

    public get interactiveRenderedStack() {
        return this._interactiveRenderedStack;
    }

    private updateViewProjectionMatrix() {
        const cameraMatrix = this.app.camera.getWorldMatrix();
        cameraMatrix.invert(this.viewMatrix);
        this.projMatrix.multiply(this.viewMatrix, this.viewProjMatrix);
        this.viewProjMatrix.toFloat32Matrix3(this.viewProjMatrixValues);
    }

    public flush() {
        if (this.currentTriangle === 0) return;
        const gl = GLUtils.getContext();

        this.updateViewProjectionMatrix();

        gl.uniformMatrix3fv(this.viewProjectionUniformLocation, false, this.viewProjMatrixValues);
        gl.uniform2f(this.textureSizeUniformLocation, this.currentTexture.width, this.currentTexture.height);
        gl.bindTexture(gl.TEXTURE_2D, this.currentTexture.glTexture);

        const floatCount = this.currentTriangle * TriangleBatchRenderer.VERTICES_IN_TRIANGLE * TriangleBatchRenderer.ATTRIBUTE_ELEMENTS_PER_VERTEX;
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertexData.subarray(0, floatCount));

        const vertexCount = this.currentTriangle * TriangleBatchRenderer.VERTICES_IN_TRIANGLE;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        this.currentTriangle = 0;
    }
}
