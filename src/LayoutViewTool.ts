import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";
import { addViewPort, drawTestLayoutGraphic } from "./utils";

export default class LayoutViewTool {
    app: Application;
    stage: Viewport;
    constructor(containerId: string) {
        const containerDom = document.getElementById(containerId)!;
        const { clientWidth: w, clientHeight: h } = containerDom;

        this.app = new Application({
            backgroundColor: 0xf2f3f4,
            width: w,
            height: h,
            antialias: true,
        });
        containerDom.appendChild(this.app.view);

        this.stage = addViewPort(this.app, w, h);

        this.stage.addChild(drawTestLayoutGraphic(w, h));
    }
}
