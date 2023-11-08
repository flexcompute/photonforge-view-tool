import { Application } from "pixi.js";
import { Viewport } from "pixi-viewport";
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
    rscp: { text: string; children: IPort[] }[];
}

export interface IPort {
    center: IXY;
    input_direction: number;
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

    createObjects(components: IComponent[]) {
        // enter port
        const handleTreeData = (components: IComponent[], layers?: ILayer[]): IOutComponent[] => {
            const componentDataArray: IOutComponent[] = [];
            components.forEach((component) => {
                if (!component.hidden) {
                    const polyData: IOutPolygon[] = [];
                    component.rawPolys.forEach((s: any) => {
                        const layer = (layers || component.layers)!.find(
                            (oneLayer) => `(${s.layer},${s.datatype})` === oneLayer.layer,
                        );
                        if (!layer?.hidden) {
                            polyData.push({
                                polygonInfo: s.poly,
                                layerInfo: layer,
                            });
                        }
                    });
                    componentDataArray.push({
                        polyData,
                        children: handleTreeData(component.children || [], component.layers || layers),
                        transform: component.transform,
                        name: component.name,
                        ports: component.rscp?.find((d) => d.text === "Ports")?.children,
                        selected: component.selected,
                    });
                }
            });
            return componentDataArray;
        };
        this.layoutTool.initComponents(handleTreeData(components));
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
