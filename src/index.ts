import { Application } from "pixi.js";
import { Viewport } from "pixi-viewport";
import SchematicViewTool from "./SchematicViewTool";
import LayoutViewTool from "./LayoutViewTool";

export interface IXY {
    x: number;
    y: number;
}
class PhotonForgeViewTool {
    schematicApp: Application;
    layoutApp: Application;
    schematicStage?: Viewport;
    layoutStage?: Viewport;
    constructor(param: { schematicContainerId: string; layoutContainerId: string }) {
        console.log("view tool init OK");
        this.schematicApp = new SchematicViewTool(param.schematicContainerId).app;
        this.layoutApp = new LayoutViewTool(param.layoutContainerId).app;

        // this.resizeCanvas();
    }

    private resizeCanvas(): void {
        const resize = () => {
            this.schematicApp.renderer.resize(window.innerWidth, window.innerHeight);
            this.layoutApp.renderer.resize(window.innerWidth, window.innerHeight);
        };
        resize();
        window.addEventListener("resize", resize);
    }
}
export default PhotonForgeViewTool;
// (window as any).PhotonForgeViewTool = PhotonForgeViewTool;
