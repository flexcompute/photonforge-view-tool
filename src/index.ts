import { Application } from "pixi.js";
import SchematicViewTool from "./SchematicViewTool";
import LayoutViewTool from "./layout/LayoutViewTool";

export interface IXY {
    x: number;
    y: number;
}

export interface IComponent {
    text: string;
    cellLayers: IPolygon[];
    layers?: ILayer[];
    hidden: boolean;
    children?: IComponent[];
    rawPolys: [];
    name: string;
    transform: any;
    selected: boolean;
    dblSelected: boolean;
    id: string;
    rscp: { text: string; children: IPort[] }[];
}

export interface IPort {
    center: IXY;
    input_direction: number;
    id: string;
    spec: {
        description: string;
        limits: number[];
        num_modes: number;
        path_profiles: {
            layer: number[];
            offset: number;
            width: number;
        }[];
        target_neff: number;
        width: number;
    };
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
export interface IOutPolygon {
    polygonInfo: number[][][];
    layerInfo: ILayer | undefined;
}
export interface IOutComponent {
    polyData: IOutPolygon[];
    children: IOutComponent[];
    name: string;
    id: string;
    transform: {
        magnification: number;
        origin: number[];
        rotation: number;
        x_reflection: boolean;
        repetition: {
            rows: number;
            columns: number;
            spacing: number[];
        };
    };
    ports?: IPort[];
    selected: boolean;
    dblSelected: boolean;
}

class PhotonForgeViewTool {
    schematicApp?: Application;
    layoutTool: LayoutViewTool;
    constructor(param: { layoutContainerId: string }) {
        console.log("view tool init OK");
        this.layoutTool = new LayoutViewTool(param.layoutContainerId);
        this.addResizeCanvasEvents();
        // this.resizeCanvas();
    }

    initSchematicApp(schematicContainerId: string) {
        this.schematicApp = new SchematicViewTool(schematicContainerId).app;
    }

    createObjects(components: IComponent[], commandType: string, extraData?: any) {
        this.layoutTool.createObjects(components, commandType, extraData);
    }

    private addResizeCanvasEvents(): void {
        const resize = () => {
            const { clientWidth: w, clientHeight: h } = this.layoutTool.app.view.parentElement!;
            this.layoutTool.app.renderer.resize(w, h);
            this.layoutTool.stage?.resize(w, h, w, h);
            this.layoutTool.resizeCallback?.();
            // this.schematicApp?.renderer.resize(window.innerWidth, window.innerHeight);
        };
        resize();
        window.addEventListener("resize", resize);
    }
}
export default PhotonForgeViewTool;
// (window as any).PhotonForgeViewTool = PhotonForgeViewTool;
