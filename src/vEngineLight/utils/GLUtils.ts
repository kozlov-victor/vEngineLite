import {Texture} from "../rendering/Texture";


export class GLUtils {

    private static gl: WebGLRenderingContext;

    public static createAndHoldContext(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext("webgl");
        if (!gl) throw new Error(`WebGL not supported`);
        this.gl = gl;
    }

    public static getContext() {
        return this.gl;
    }

    public static createShader(type: GLenum, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) throw new Error(`failed to create shader`);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error(`failed to compile shader`);
    }

    public static createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }

        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        throw new Error(`failed to link program`);
    }

    private static setTextureFilters() {
        const gl = this.gl;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    public static createTextureFromImage(image: HTMLImageElement) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,     // target
            0,           // level (mipmap level)
            gl.RGBA,           // internal format
            gl.RGBA,           // format
            gl.UNSIGNED_BYTE,  // type
            image              // source (HTMLImageElement)
        );
        this.setTextureFilters();
        gl.bindTexture(gl.TEXTURE_2D, null);
        return new Texture(texture, image.width, image.height);
    }

    public static createColoredTexture(r: number, g: number, b: number, a = 255) {
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const width = 1;
        const height = 1;

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([r, g, b, a])
        );

        this.setTextureFilters();
        gl.bindTexture(gl.TEXTURE_2D, null);

        return new Texture(texture, width, height);
    }

    private static emptyTexture:Texture;

    public static getEmptyTexture() {
        if (!this.emptyTexture) this.emptyTexture = this.createColoredTexture(255,255,255);
        return this.emptyTexture;
    }



}
