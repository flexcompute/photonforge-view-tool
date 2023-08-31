import { Application } from "pixi.js";
import { Viewport } from "pixi-viewport";
import SchematicViewTool from "./SchematicViewTool";
import LayoutViewTool from "./layout/LayoutViewTool";

export interface IXY {
    x: number;
    y: number;
}

export interface ILayer {
    id: number | string;
    hidden?: boolean;
    name: string;
    color: string;
    pattern: string;
    patternImage?: string;
    layer: string;
    description: string;
}

export interface IPolygon {
    layer: string;
    datatype: string;
    polys: number[][][][];
}

class PhotonForgeViewTool {
    schematicApp?: Application;
    layoutTool: LayoutViewTool;
    schematicStage?: Viewport;
    layoutStage?: Viewport;
    constructor(param: { layoutContainerId: string }) {
        console.log("view tool init OK");
        this.layoutTool = new LayoutViewTool(param.layoutContainerId);

        // this.resizeCanvas();
    }

    initSchematicApp(schematicContainerId: string) {
        this.schematicApp = new SchematicViewTool(schematicContainerId).app;
    }

    createObjects(components: { text: string; cellLayers: IPolygon[]; layers: ILayer[]; hidden: boolean }[]) {
        const componentDataArray: { polygonInfo: number[][][]; layerInfo: ILayer | undefined }[] = [];
        components.forEach((component) => {
            if (!component.hidden) {
                component.cellLayers.forEach((s) => {
                    const layer = component.layers.find(
                        // (oneLayer) => s.layer === oneLayer.layer.split(",")[0].substring(1),
                        (oneLayer) => s.layer === oneLayer.layer,
                    );
                    if (!layer?.hidden) {
                        componentDataArray.push({
                            polygonInfo: s.polys.flat(),
                            layerInfo: layer,
                        });
                    }
                });
            }
        });
        this.layoutTool.initComponents(componentDataArray);
    }

    private resizeCanvas(): void {
        const resize = () => {
            this.schematicApp?.renderer.resize(window.innerWidth, window.innerHeight);
            this.layoutTool.app.renderer.resize(window.innerWidth, window.innerHeight);
        };
        resize();
        window.addEventListener("resize", resize);
    }
}
export default PhotonForgeViewTool;
// (window as any).PhotonForgeViewTool = PhotonForgeViewTool;
