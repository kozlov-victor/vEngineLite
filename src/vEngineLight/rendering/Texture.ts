
export class Texture {
    constructor(
        public readonly glTexture: WebGLTexture,
        public readonly width: number,
        public readonly height: number
    ) {
    }
}
