
export type n9 = [number, number, number, number, number, number, number, number, number];
export type n2 = [number, number];
export type n4 = [number, number,number, number];

export interface IFrame {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface SpriteFrame extends IFrame {
    name: string;
}

export interface SpriteSheet {
    width: number;
    height: number;
    frames: SpriteFrame[];
}

export interface Vertex {
    position: n2;
    textCoord: n2;
    colorTint: n4;
}

export interface Triangle {
    v1: Vertex;
    v2: Vertex;
    v3: Vertex;
}

export interface IUpdateable {
    update(dt:number):void;
}
