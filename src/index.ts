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
    rscp: { text: string; children: IPort[]; clickItem: IPort }[];
    detectPorts: IPort[];
}

export interface IPort {
    center: IXY;
    input_direction: number;
    id: string;
    hidden: boolean;
    name: string;
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
    runningPromise?: Promise<void>;
    constructor(param: { layoutContainerId: string; detectPortsCallback: (port: any) => {} }) {
        console.log("view tool init OK");
        this.layoutTool = new LayoutViewTool(param.layoutContainerId, param.detectPortsCallback);
        this.addResizeCanvasEvents();
        // this.resizeCanvas();
    }

    initSchematicApp(schematicContainerId: string) {
        this.schematicApp = new SchematicViewTool(schematicContainerId).app;
    }

    async createObjects(components: IComponent[], commandType: string, extraData?: any) {
        if (this.runningPromise) {
            await this.runningPromise;
            this.runningPromise = undefined;
        }
        this.runningPromise = this.layoutTool.createObjects(components, commandType, extraData);
    }

    private addResizeCanvasEvents(): void {
        const resize = () => {
            const { clientWidth: w, clientHeight: h } = this.layoutTool.app.view.parentElement!;
            this.layoutTool.app.renderer.resize(w, h);
            this.layoutTool.stage?.resize(w, h, w, h);
            Object.values(this.layoutTool.resizeCallback).forEach((f) => f());
            // this.schematicApp?.renderer.resize(window.innerWidth, window.innerHeight);
        };
        resize();
        window.addEventListener("resize", resize);
    }
}
export default PhotonForgeViewTool;
// (window as any).PhotonForgeViewTool = PhotonForgeViewTool;
