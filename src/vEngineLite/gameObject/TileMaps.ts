import {ITileLayer} from "@vEngineLite/gameObject/TileMap";

export interface ITiledMapLayer {
    data: number[];
    height: number;
    width: number;
    id: number;
    name: string;
    opacity: number;
    type: 'tilelayer'|'objectlayer';
    visible: boolean;
    x: number;
    y: number;
    offsetx?: number;
    offsety?: number;
    parallaxx?: number;
    parallaxy?: number;
}

export interface ITiledMapTileSet {
    columns: number;
    firstgid: number;
    image: string;
    imageheight:32,
    imagewidth:256,
    margin:0,
    name: string;
    spacing: number;
    tilecount:number;
    tileheight:number;
    tilewidth:number;
}

export interface ITiledMapProperty {
    name: string;
    type: 'string'|'int'|'float'|'bool'|'list'|'color'|'file'|'object';
    value: any;
}

export interface ITiledTileMap {
    compressionlevel: number;
    height:number;
    infinite:boolean;
    layers:ITiledMapLayer[];
    nextlayerid:number;
    nextobjectid:number;
    orientation:string;
    renderorder:string;
    tiledversion:string;
    tileheight:number;
    tilesets:ITiledMapTileSet[];
    tilewidth:number;
    type:string;
    version:string;
    width:number;
    properties?: ITiledMapProperty[];
}

export class TileMaps {

    public static fromTiledTileMap(map:ITiledTileMap, layerNames: string[], tileSetName: string): {layers: ITileLayer[],mapWidthInTiles: number,tilesetCols: number,tilesetRows: number} {
        const layers: ITileLayer[] = [];
        for (const layerName of layerNames) {
            const layer = map.layers.find(layer => layer.name == layerName);
            if (!layer) throw new Error(`Layer ${layerName} not found!`);
            layers.push({
                data: layer.data,
                parallaxX: layer.parallaxx ?? 1,
                parallaxY: layer.parallaxy ?? 1,
            });
        }
        const tileSet = map.tilesets.find(tileset => tileset.name == tileSetName);
        if (!tileSet) throw new Error(`Tile set ${tileSetName} not found!`);
        return {
            layers,
            mapWidthInTiles: map.width,
            tilesetRows: tileSet.imageheight / tileSet.tileheight,
            tilesetCols: tileSet.columns,
        }
    }

    public static getTiledMapCustomProperty(map: ITiledTileMap, propertyName: string): ITiledMapProperty | undefined {
        if (!map.properties) return undefined;
        const res = map.properties.find(prop => prop.name === propertyName);
        if (!res) throw new Error(`Property ${propertyName} not found!`);
        return res;
    }

}
