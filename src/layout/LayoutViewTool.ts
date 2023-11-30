import { Viewport } from "pixi-viewport";
import { Application, Container, Graphics, Point, Rectangle, SCALE_MODES, Text, settings } from "pixi.js";
import { addViewPort, drawTestLayoutGraphic } from "../utils";
import Component from "./Component";
import { IPolygon, ILayer, IOutComponent, IPort, IComponent, IOutPolygon } from "..";
import { regeneratePort, showComponentPorts } from "./portUtils";

export default class LayoutViewTool {
    app: Application;
    stage?: Viewport;
    w;
    h;
    componentArray: Container[] = [];
    containerDom: HTMLElement;
    textWrapDom: HTMLDivElement;
    resizeCallback?: Function;
    idCacheMap = new Map<string, Container[]>();
    layerCacheMap = new Map<string, Container[]>();
    portCacheMap = new Map<string, Container[]>();
    reverseContainer = new Container();

    portContainer = new Container();
    selectContainer = new Container();

    selectedObjectArray: Container[] = [];
    selectComponentName = "";
    constructor(containerId: string) {
        this.containerDom = document.getElementById(containerId)!;
        this.textWrapDom = document.createElement("div");
        this.containerDom.append(this.textWrapDom);

        const { clientWidth: w, clientHeight: h } = this.containerDom;
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

        this.containerDom.appendChild(this.app.view);
    }

    createObjects(components: IComponent[], commandType: string, extraData?: any) {
        console.warn("from view tool", components, commandType, extraData);
        if (commandType === "component hidden") {
            this.idCacheMap.get(extraData.id)!.forEach((c) => (c.visible = !extraData.hidden));
        } else if (["component check", "component click"].includes(commandType)) {
            this.unSelectComponent();
            this.selectedObjectArray.length = 0;
            if (extraData) {
                const containers = this.idCacheMap.get(extraData.id)!;
                if (
                    "component check" === commandType ||
                    containers[0].children.every((c) => c.visible) ||
                    extraData.dblSelected
                ) {
                    if (extraData.transform.repetition?.spacing) {
                        this.selectedObjectArray.push(...(containers.map((c) => c.children).flat() as Container[]));
                    } else {
                        this.selectedObjectArray.push(...containers);
                    }
                    this.selectComponentName = extraData.name;
                }
            }
            if ("component click" === commandType) {
                this.generateSelectBound();
            } else {
                // zoom in
                if (this.selectedObjectArray.length) {
                    // hide other component
                    this.idCacheMap.forEach((cs) => {
                        cs.forEach((c) => {
                            c.visible = false;
                            c.children.forEach((cc) => {
                                if (!cc.name) {
                                    cc.visible = false;
                                }
                            });
                        });
                    });
                    const setComponentChildrenVisible = (node: any) => {
                        if (node.id) {
                            (this.idCacheMap.get(node.id) as Container[]).forEach((element) => {
                                element.visible = true;
                                element.children.forEach((cc: any) => {
                                    if (!cc.name) {
                                        cc.visible = true;
                                    }
                                });
                            });
                            node.children?.forEach((c: any) => {
                                setComponentChildrenVisible(c);
                            });
                        }
                    };
                    const setComponentParentVisible = (node: any) => {
                        if (node.id) {
                            (this.idCacheMap.get(node.id) as Container[]).forEach((element) => {
                                element.visible = true;
                            });
                            setComponentParentVisible(node.parent);
                        }
                    };
                    setComponentChildrenVisible(extraData);
                    setComponentParentVisible(extraData.parent);

                    this.stage?.removeChild(this.reverseContainer);
                    const rect = this.selectedObjectArray[0].getBounds();
                    this.selectedObjectArray.forEach((s, i) => {
                        s.visible = i === 0;
                    });
                    this.stage?.addChildAt(this.reverseContainer, 0);
                    this.stage?.fit(true, rect.width * 2, rect.height * 2);
                    this.stage?.moveCenter(rect.x + rect.width / 2, rect.y + rect.height / 2);

                    // handle port
                    showComponentPorts(this.portContainer, extraData.id, this.portCacheMap);
                    this.resizeCallback!();
                }
            }
        } else if (commandType === "layer hidden") {
            components.forEach((c) => {
                c.layers?.forEach((l) => {
                    const target = this.layerCacheMap.get(l.layer);
                    if (target) {
                        target.forEach((c1) => {
                            c1.visible = !l.hidden;
                        });
                    }
                });
            });
        } else {
            let selectComponentNode: any;
            // enter
            const handleTreeData = (
                components: IComponent[],
                layers?: ILayer[],
                isTopLevel = false,
            ): IOutComponent[] => {
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
                        if (component.dblSelected) {
                            selectComponentNode = component;
                        }
                        componentDataArray.push({
                            polyData,
                            selected: component.selected,
                            dblSelected: component.dblSelected,
                            children: handleTreeData(component.children || [], component.layers || layers),
                            transform: component.transform,
                            name: component.name,
                            ports: component.rscp?.find((d) => d.text === "Ports")?.children,
                            id: component.id,
                        });
                    }
                });
                return componentDataArray;
            };
            this.initComponents(handleTreeData(components, undefined, true));
            // mock check
            if (selectComponentNode) {
                this.createObjects(components, "component check", selectComponentNode);
            }
        }
    }

    initComponents(dataArray: IOutComponent[]) {
        this.textWrapDom.innerHTML = "";
        this.idCacheMap.clear();
        this.layerCacheMap.clear();
        this.portCacheMap.clear();
        this.componentArray.length = 0;
        this.selectedObjectArray.length = 0;
        const promises: Promise<void>[] = [];
        const ports: { ports: IPort[]; componentId: string }[] = [];

        let activeComponentId: string | undefined = undefined;
        const generateComponent = (data: IOutComponent) => {
            if (data.ports) {
                ports.push({ ports: data.ports, componentId: data.id });
            }
            const container = new Container();
            container.name = data.name;
            if (this.idCacheMap.get(data.id)) {
                this.idCacheMap.get(data.id)!.push(container);
            } else {
                this.idCacheMap.set(data.id, [container]);
            }
            if (data.transform.repetition?.spacing) {
                const { rows, columns, spacing } = data.transform.repetition;
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < columns; j++) {
                        data.polyData.forEach((p) => {
                            const comp = new Component(p);
                            promises.push(comp.textureLoadPromise);
                            comp.viewObject.position.set(j * spacing[0], i * spacing[1]);
                            container.addChild(comp.viewObject);

                            if (p.layerInfo?.layer) {
                                if (this.layerCacheMap.get(p.layerInfo.layer)) {
                                    this.layerCacheMap.get(p.layerInfo.layer)!.push(comp.viewObject);
                                } else {
                                    this.layerCacheMap.set(p.layerInfo.layer, [comp.viewObject]);
                                }
                            }
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

                    if (p.layerInfo?.layer) {
                        if (this.layerCacheMap.get(p.layerInfo.layer)) {
                            this.layerCacheMap.get(p.layerInfo.layer)!.push(comp.viewObject);
                        } else {
                            this.layerCacheMap.set(p.layerInfo.layer, [comp.viewObject]);
                        }
                    }
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
                    c.rotation = data.transform.rotation;
                });
            }
            if (data.dblSelected) {
                activeComponentId = data.id;
            }
            if (data.selected) {
                function ifParentActive(data: any): boolean {
                    return data.dblSelected || (data.parent && ifParentActive(data.parent));
                }
                const containers = this.idCacheMap.get(data.id)!;
                if (ifParentActive(data)) {
                    if (data.transform.repetition?.spacing) {
                        this.selectedObjectArray.push(...(containers.map((c) => c.children).flat() as Container[]));
                    } else {
                        this.selectedObjectArray.push(...containers);
                    }
                    this.selectComponentName = data.name;
                }
            }
            return container;
        };
        dataArray.forEach((data) => {
            this.componentArray.push(generateComponent(data));
        });
        Promise.all(promises).then(() => {
            this.reverseContainer = new Container();
            this.reverseContainer.name = "reverse-container";
            this.reverseContainer.scale.y = -1;

            this.componentArray.forEach((c) => {
                this.reverseContainer.addChild(c);
            });

            this.selectContainer.name = "select-bound-container";
            this.portContainer.name = "port=container";

            const rect = this.reverseContainer.getBounds();
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

            this.stage.addChild(this.reverseContainer);
            this.stage.addChild(this.selectContainer);
            this.reverseContainer.addChild(this.portContainer);

            const regenerateTexts = () => {
                this.textWrapDom.innerHTML = "";
                this.selectedObjectArray.forEach((s) => {
                    const rect = s.getBounds();
                    if (!s.visible || rect.width === 0) {
                        return;
                    }
                    const x = (rect.x + rect.width / 2) / this.app.screen.width;
                    const y = (rect.y + rect.height / 2) / this.app.screen.height;
                    const textNode = document.createTextNode(this.selectComponentName);
                    const textElement = document.createElement("span");
                    textElement.appendChild(textNode);
                    textElement.style.position = "absolute";
                    textElement.style.pointerEvents = "none";
                    textElement.style.left = `${x * 100}%`;
                    textElement.style.top = `${y * 100}%`;
                    textElement.style.userSelect = "none";
                    textElement.style.transform = "translate(-50%, -50%)";
                    this.textWrapDom.appendChild(textElement);
                });
            };
            this.resizeCallback = regenerateTexts;
            this.stage.on("moved", regenerateTexts);

            regeneratePort(ports, this.portContainer, this.portCacheMap);
            if (activeComponentId) {
                showComponentPorts(this.portContainer, activeComponentId, this.portCacheMap);
            }
            this.generateSelectBound();
            regenerateTexts();
        });
    }

    generateSelectBound() {
        this.selectContainer.removeChildren();

        this.stage?.removeChild(this.reverseContainer);
        const boundGraphicsArray: Graphics[] = [];
        this.selectedObjectArray.forEach((c: Container) => {
            if (c.visible) {
                const boundGraphics = new Graphics();
                const rect = c.getBounds();
                boundGraphics.lineStyle(1, 0x000000);
                boundGraphics.beginFill(0xffffff, 0.7);
                boundGraphics.line.native = true;
                boundGraphics.drawRect(rect.x, rect.y, rect.width, rect.height);
                boundGraphics.endFill();

                boundGraphicsArray.push(boundGraphics);
            }
        });
        this.stage?.addChildAt(this.reverseContainer, 0);
        boundGraphicsArray.forEach((c) => {
            this.selectContainer.addChild(c);
        });
        this.resizeCallback?.(boundGraphicsArray, this.selectComponentName);
    }

    unSelectComponent() {
        this.selectComponentName = "";
        this.selectedObjectArray.length = 0;
        this.textWrapDom.innerHTML = "";
        this.selectContainer.removeChildren();
    }
}
