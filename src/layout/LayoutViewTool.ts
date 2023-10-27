import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics, Rectangle } from "pixi.js";
import { addViewPort, drawTestLayoutGraphic } from "../utils";
import Component from "./Component";
import { IPolygon, ILayer, IOutComponent } from "..";

export default class LayoutViewTool {
    app: Application;
    stage?: Viewport;
    w;
    h;
    componentGroup: Container[] = [];
    constructor(containerId: string) {
        const containerDom = document.getElementById(containerId)!;
        const { clientWidth: w, clientHeight: h } = containerDom;
        this.w = w;
        this.h = h;
        this.app = new Application({
            backgroundColor: 0xf2f3f4,
            width: w,
            height: h,
            antialias: true,
        });

        const axis = new Graphics();
        axis.lineStyle(2, 0xeeeeee, 1);
        axis.moveTo(this.w / 2, 0);
        axis.lineTo(this.w / 2, this.h);
        axis.moveTo(0, this.h / 2);
        axis.lineTo(this.w, this.h / 2);
        // axis.alpha = 0.5;
        this.app.stage.addChild(axis);

        containerDom.appendChild(this.app.view);
    }

    initComponents(dataArray: IOutComponent[]) {
        this.componentGroup.length = 0;
        const promises: Promise<void>[] = [];
        const generateComponent = (data: IOutComponent) => {
            const container = new Container();
            container.name = data.name;
            if (data.transform.origin) {
                container.position.set(data.transform.origin[0], data.transform.origin[1]);
                container.scale.y = data.transform.x_reflection ? -1 : 1;
            }
            data.polyData.forEach((p) => {
                const comp = new Component(p);
                promises.push(comp.textureLoadPromise);
                container.addChild(comp.viewObject);
            });
            data.children.forEach((data1) => {
                container.addChild(generateComponent(data1));
            });
            return container;
        };
        dataArray.forEach((data) => {
            this.componentGroup.push(generateComponent(data));
        });
        Promise.all(promises).then(() => {
            const container = new Container();
            container.name = "reverse-container";
            container.scale.y = -1;
            this.componentGroup.forEach((c) => {
                container.addChild(c);
            });
            const rect = container.getBounds();
            if (!this.stage) {
                this.stage = addViewPort(
                    this.app,
                    this.w,
                    this.h,
                    0.4 * Math.min(this.w / rect.width, this.h / rect.height),
                    {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                    },
                );
            } else {
                this.stage.scale.set(0.4 * Math.min(this.w / rect.width, this.h / rect.height));
                this.stage.moveCenter(rect.x + rect.width / 2, rect.y + rect.height / 2);
            }
            this.stage.removeChildren();
            this.stage.addChild(container);
        });
    }
}
