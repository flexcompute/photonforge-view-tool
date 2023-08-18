import { Application, Graphics } from "pixi.js";
import { Viewport } from "pixi-viewport";
// import "./style.css";

// (window as any).aa = 222;

class PhotonForgeViewTool {
    schematicApp: Application;
    layoutApp: Application;
    schematicStage?: Viewport;
    layoutStage?: Viewport;
    constructor(param: { schematicContainerId: string; layoutContainerId: string }) {
        console.log("view tool init OK");
        const container0Dom = document.getElementById(param.schematicContainerId)!;
        const container1Dom = document.getElementById(param.layoutContainerId)!;
        const { clientWidth: w, clientHeight: h } = container1Dom;

        this.schematicApp = new Application({
            backgroundColor: 0xf2f3f4,
            width: w,
            height: h,
        });
        container0Dom.appendChild(this.schematicApp.view);

        this.layoutApp = new Application({
            backgroundColor: 0xf2f3f4,
            width: w,
            height: h,
        });
        container1Dom.appendChild(this.layoutApp.view);

        // ========================
        this.schematicStage = this.addViewPort(this.schematicApp, w, h);
        this.layoutStage = this.addViewPort(this.layoutApp, w, h);
        // this.resizeCanvas();
    }

    private addViewPort(app: Application, w: number, h: number) {
        const stage = new Viewport({
            screenWidth: w,
            screenHeight: h,
            worldHeight: w,
            worldWidth: h,
            interaction: app.renderer.plugins.interaction,
        });
        app.stage.addChild(stage);
        stage
            .drag()
            .pinch()
            .wheel()
            // .decelerate()
            .setZoom(0.5)
            .clampZoom({ maxScale: 2, minScale: 0.3 }).interactiveChildren = true;

        return stage;
    }

    public test() {
        const { width: w1, height: h1 } = this.layoutApp.view;
        const node = new Graphics();
        node.beginFill(0xdeff49, 1);
        node.lineStyle(2, 0x22ff00, 1);
        node.drawRect(w1 / 2 - 230, h1 / 2 - 10, 240, 90);
        node.drawRect(w1 / 2 + 230, h1 / 2 + 10, 240, 90);
        node.endFill();
        node.moveTo(w1 / 2 + 10, h1 / 2 + 45);
        node.lineTo(w1 / 2 + 230, h1 / 2 + 55);
        this.schematicStage!.addChild(node);

        const { width: w, height: h } = this.layoutApp.view;
        const testG = new Graphics();
        testG.beginFill(0xdeff49, 1);
        testG.lineStyle(2, 0x22ff00, 1);
        testG.drawCircle(w / 2, h / 2, 100);
        testG.drawRect(w / 2 - 120, h / 2 - 130, 240, 20);
        testG.drawRect(w / 2 - 120, h / 2 + 110, 240, 20);
        testG.endFill();
        this.layoutStage!.addChild(testG);
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
