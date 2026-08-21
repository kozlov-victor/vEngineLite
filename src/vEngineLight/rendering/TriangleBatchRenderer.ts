import {GLUtils} from "../utils/GLUtils";
import {Camera} from "../camera/Camera";
import {Size} from "../utils/Size";
import {Texture} from "./Texture";
import {TextureInfo} from "../components/TextureInfo";
import {n2, n9, Triangle, Vertex} from "../types";
import {Mat2d} from "../utils/Mat2d";



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
    private camera: Camera;

    private readonly projMatrix = new Mat2d();
    private readonly viewMatrix = new Mat2d();
    private readonly viewProjMatrix = new Mat2d();
    private readonly mat3: n9 = [0,0,0,0,0,0,0,0,0];
    private readonly point: n2 = [0,0];
    private readonly triangle: Triangle = {
        v1: {position: [0,0],textCoord: [0,0],colorTint:[0,0,0,0]},
        v2: {position: [0,0],textCoord: [0,0],colorTint:[0,0,0,0]},
        v3: {position: [0,0],textCoord: [0,0],colorTint:[0,0,0,0]},
    };

    constructor(readonly width: number, readonly height: number ) {
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
                gl_FragColor = texture2D(u_image, v_texCoord) * v_colorTint;
            }
        `;

        const gl = GLUtils.getContext();
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
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);
    }

    private updateProjectionMatrix() {
        Mat2d.projection(this.width, this.height, this.projMatrix);
    }

    public setCamera(camera: Camera) {
        this.camera = camera;
    }

    public bind() {
        const gl = GLUtils.getContext();
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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

    private batchVertex(v: Vertex, worldMatrix: Mat2d, i: number) {
        const vData = this.vertexData;
        const point = worldMatrix.transformPoint(v.position[0], v.position[1], this.point);
        vData[i] = point[0]; vData[i + 1] = point[1]; vData[i + 2] = v.textCoord[0]; vData[i + 3] = v.textCoord[1];
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
        this.batchVertex(triangle.v1, worldMatrix, i);
        this.batchVertex(triangle.v2, worldMatrix, i+size);
        this.batchVertex(triangle.v3, worldMatrix, i+size*2);

        this.currentTriangle++;
    }

    public batchSprite(size: Size, textureInfo: TextureInfo, worldMatrix: Mat2d) {

        const uv = textureInfo.rect.uv;
        const objWidth = size.w, objHeight = size.h;

        const
            texFrameWidth = textureInfo.rect.size.w,
            texFrameHeight = textureInfo.rect.size.h;

        const u = uv.x, v = uv.y;
        const colNorm = textureInfo.color.getNormalized();

        const t = this.triangle;
        // triangle 1
        // v1
        t.v1.position[0] = 0;
        t.v1.position[1] = 0;
        t.v1.textCoord[0] = u;
        t.v1.textCoord[1] = v;
        t.v1.colorTint = colNorm;
        // v2
        t.v2.position[0] = objWidth;
        t.v2.position[1] = 0;
        t.v2.textCoord[0] = u + texFrameWidth;
        t.v2.textCoord[1] = v;
        t.v2.colorTint = colNorm;
        // v3
        t.v3.position[0] = 0;
        t.v3.position[1] = objHeight;
        t.v3.textCoord[0] = u;
        t.v3.textCoord[1] = v + texFrameHeight;
        t.v3.colorTint = colNorm;
        this.batchTriangle(t,textureInfo.texture,worldMatrix);

        // triangle 2
        // v1
        t.v1.position[0] = 0;
        t.v1.position[1] = objHeight;
        t.v1.textCoord[0] = u;
        t.v1.textCoord[1] = v + texFrameHeight;
        //t.v1.colorTint = colNorm;
        // v2
        t.v2.position[0] = objWidth;
        t.v2.position[1] = 0;
        t.v2.textCoord[0] = u + texFrameWidth;
        t.v2.textCoord[1] = v;
        //t.v2.colorTint = colNorm;
        // v3
        t.v3.position[0] = objWidth;
        t.v3.position[1] = objHeight;
        t.v3.textCoord[0] = u + texFrameWidth;
        t.v3.textCoord[1] = v + texFrameHeight;
        //t.v3.colorTint = colNorm;
        this.batchTriangle(t,textureInfo.texture,worldMatrix);
    }

    public clearRenderBuffer() {
        const gl = GLUtils.getContext();
        gl.viewport(0, 0, this.width, this.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    public flush() {
        if (this.currentTriangle === 0) return;
        const gl = GLUtils.getContext();

        if (this.camera) {
            const cameraMatrix = this.camera.transform.getWorldMatrix();
            cameraMatrix.invert(this.viewMatrix);
            this.projMatrix.multiply(this.viewMatrix, this.viewProjMatrix);
        } else {
            this.viewProjMatrix.copyFrom(this.projMatrix);
        }

        gl.uniformMatrix3fv(this.viewProjectionUniformLocation, false, this.viewProjMatrix.toMat3Vec(this.mat3));
        gl.uniform2f(this.textureSizeUniformLocation, this.currentTexture.width, this.currentTexture.height);
        gl.bindTexture(gl.TEXTURE_2D, this.currentTexture.glTexture);

        const dataView = this.vertexData.subarray(0, this.currentTriangle * TriangleBatchRenderer.VERTICES_IN_TRIANGLE * TriangleBatchRenderer.ATTRIBUTE_ELEMENTS_PER_VERTEX);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, dataView);

        const vertexCount = this.currentTriangle * TriangleBatchRenderer.VERTICES_IN_TRIANGLE;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        this.currentTriangle = 0;
    }
}
