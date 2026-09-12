
export interface ITileMapLayer {
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
}

export interface ITileMapTileSet {
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

export interface TiledTileMap {
    compressionlevel: number;
    height:number;
    infinite:boolean;
    layers:ITileMapLayer[];
    nextlayerid:number;
    nextobjectid:number;
    orientation:string;
    renderorder:string;
    tiledversion:string;
    tileheight:number;
    tilesets:ITileMapTileSet[];
    tilewidth:number;
    type:string;
    version:string;
    width:number;
}

export class TileMaps {

    public static fromTiledTileMap(map:TiledTileMap, layerName: string, tileSetName: string): {data: number[],mapWidthInTiles: number,tilesetCols: number,tilesetRows: number} {
        const layer = map.layers.find(layer => layer.name == layerName);
        if (!layer) throw new Error(`Layer ${layerName} not found!`);
        const tileSet = map.tilesets.find(tileset => tileset.name == tileSetName);
        if (!tileSet) throw new Error(`Tile set ${tileSetName} not found!`);
        return {
            data: layer.data,
            mapWidthInTiles: layer.width,
            tilesetRows: tileSet.imageheight / tileSet.tileheight,
            tilesetCols: tileSet.columns,
        }
    }

}
