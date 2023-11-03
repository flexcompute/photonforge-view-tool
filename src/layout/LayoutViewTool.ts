import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics, Rectangle } from "pixi.js";
import { addViewPort, drawTestLayoutGraphic } from "../utils";
import Component from "./Component";
import { IPolygon, ILayer, IOutComponent, IPort } from "..";

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
            if (data.transform.repetition?.spacing) {
                const { rows, columns, spacing } = data.transform.repetition;
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < columns; j++) {
                        data.polyData.forEach((p) => {
                            const comp = new Component(p);
                            promises.push(comp.textureLoadPromise);
                            comp.viewObject.position.set(j * spacing[0], i * spacing[1]);
                            container.addChild(comp.viewObject);
                        });
                        data.children.forEach((data1) => {
                            const childrenContainer = generateComponent(data1);
                            childrenContainer.position.set(j * spacing[0], i * spacing[1]);
                            container.addChild(childrenContainer);
                        });
                    }
                }
            } else {
                data.polyData.forEach((p) => {
                    const comp = new Component(p);
                    promises.push(comp.textureLoadPromise);
                    container.addChild(comp.viewObject);
                });
                data.children.forEach((data1) => {
                    container.addChild(generateComponent(data1));
                });
            }
            if (data.transform.origin) {
                container.children.forEach((c) => {
                    c.scale.set(data.transform.magnification);
                    c.scale.y *= data.transform.x_reflection ? -1 : 1;
                    c.position.x += data.transform.origin[0];
                    c.position.y += data.transform.origin[1];
                    c.rotation = (Math.PI / 180) * data.transform.rotation;
                });
            }
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

            const ports: IPort[] = [];
            dataArray.forEach((d) => {
                if (d.ports) {
                    ports.push(...d.ports);
                }
            });
            this.handlePorts(ports);
        });
    }

    handlePorts(ports: IPort[]) {
        function drawPort(portLine: Graphics, p: IPort) {
            portLine.moveTo(0, -p.spec.width / 2);
            portLine.lineTo(0, p.spec.width / 2);

            const halfA = 0.2;
            portLine.moveTo(0, -halfA);
            portLine.lineTo(0, halfA);
            portLine.lineTo(1.5 * halfA, 0);
            portLine.lineTo(0, -halfA);
        }

        ports.forEach((p) => {
            const portLine = new Graphics();
            portLine.lineStyle(0.12, 0x820080);
            // portLine.line.native = true;
            drawPort(portLine, p);
            portLine.position.set(p.center.x, p.center.y);
            portLine.rotation = -(p.input_direction * Math.PI) / 180;

            const portLine2 = new Graphics();
            portLine2.lineStyle(1, 0x820080);
            portLine2.line.native = true;
            drawPort(portLine2, p);
            portLine2.position.set(p.center.x, p.center.y);
            portLine2.rotation = -(p.input_direction * Math.PI) / 180;

            this.stage!.addChild(portLine, portLine2);
        });
    }
}
