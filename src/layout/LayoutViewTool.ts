import { Viewport } from "pixi-viewport";
import { Application, Container, DisplayObject, Graphics } from "pixi.js";
import { addViewPort } from "../utils";
import Component from "./Component";
import { IPolygon, ILayer, IOutComponent, IPort, IComponent, IOutPolygon } from "..";
import { handlePortsCommand, regeneratePort, showComponentPorts } from "./portUtils";
import { generateActiveComponent } from "./activeUtils";

const DOUBLE_CLICK = "component check";
const SINGLE_CLICK = "component click";
export interface IPortInfoInMap {
    name: string;
    obj: Container;
}
export default class LayoutViewTool {
    app: Application;
    stage?: Viewport;
    w;
    h;
    stageInitialData = { scale: 1, center: [0, 0] };
    componentArray: Container[] = [];
    containerDom: HTMLElement;
    textWrapDom: HTMLDivElement;
    resizeCallback: { [key: string]: Function } = {};
    idCacheMap = new Map<string, Container[]>();
    layerCacheMap = new Map<string, Container[]>();
    portCacheMap = new Map<string, IPortInfoInMap[]>();
    reverseContainer = new Container();
    activeComponentContainer = new Container();
    portContainer = new Container();
    selectContainer = new Container();

    selectedObjectArray: Container[] = [];
    selectComponentName = "";
    detectPortsCallback: (port: any) => {};
    constructor(containerId: string, detectPortsCallback: (port: any) => {}) {
        this.detectPortsCallback = detectPortsCallback;
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
        console.warn(commandType, "extraData:", extraData);
        if (commandType === "component hidden") {
            this.idCacheMap.get(extraData.id)!.forEach((c) => (c.visible = !extraData.hidden));
        } else if ([DOUBLE_CLICK, SINGLE_CLICK].includes(commandType)) {
            // check is dbclick, click is single click(left red)
            this.unSelectComponent();
            this.selectedObjectArray.length = 0;
            if (extraData) {
                const containers = this.idCacheMap.get(extraData.id)!;
                if (
                    DOUBLE_CLICK === commandType ||
                    containers[0].children.every((c) => c.visible) ||
                    extraData.dblSelected
                ) {
                    this.selectedObjectArray.push(...containers);
                    this.selectComponentName = extraData.name;
                }
            }
            if (SINGLE_CLICK === commandType) {
                this.generateSelectBound();
            } else {
                const target = this.activeComponentContainer.children.find((c) => c.name === extraData.name);
                if (target) {
                    this.activeComponentContainer.visible = true;
                    this.reverseContainer.visible = false;
                    const activeContainerIndex = this.stage!.children.indexOf(this.activeComponentContainer);
                    this.stage!.removeChild(this.activeComponentContainer);
                    const rect = target.getBounds();
                    this.stage!.addChildAt(this.activeComponentContainer, activeContainerIndex);
                    this.activeComponentContainer.children.forEach((s) => {
                        s.visible = false;
                    });
                    target.visible = true;
                    this.stage?.fit(true, rect.width * 2, rect.height * 2);
                    this.stage?.moveCenter(rect.x + rect.width / 2, rect.y + rect.height / 2);
                    const ports = extraData.rscp?.find((d: any) => d.text === "Ports")?.children as IPort[];
                    showComponentPorts(this.portContainer, extraData.name, this.portCacheMap, ports);
                } else {
                    this.activeComponentContainer.visible = false;
                    this.reverseContainer.visible = true;
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
                                    node.children?.forEach((c: any) => {
                                        setComponentChildrenVisible(c);
                                    });
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
                        const rect = (
                            this.selectedObjectArray[0].children.every((cc) => cc.name === "repetition-container")
                                ? this.selectedObjectArray[0].children[0]
                                : this.selectedObjectArray[0]
                        ).getBounds();
                        this.selectedObjectArray.forEach((s, i) => {
                            s.visible = i === 0;
                        });
                        this.stage?.addChildAt(this.reverseContainer, 0);
                        this.stage?.fit(true, rect.width * 2, rect.height * 2);
                        this.stage?.moveCenter(rect.x + rect.width / 2, rect.y + rect.height / 2);

                        // handle port
                        showComponentPorts(this.portContainer, extraData.name, this.portCacheMap);
                        Object.values(this.resizeCallback).forEach((f) => f());
                    }
                }
                this.stageInitialData.scale = this.stage!.scale.x;
                this.stageInitialData.center = [this.stage!.center.x, this.stage!.center.y];
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
        } else if (commandType.includes("port")) {
            handlePortsCommand(commandType as any, extraData, this);
        } else if (["model active", "model remove"].includes(commandType)) {
        } else if (commandType.includes("zoom")) {
            const value = commandType === "zoom in" ? 1.1 : 1 / 1.1;
            this.stage!.setZoom(this.stage!.scale.x * value, true);
        } else if (commandType === "resetView") {
            this.stage!.scale.set(this.stageInitialData.scale);
            this.stage!.moveCenter(this.stageInitialData.center[0], this.stageInitialData.center[1]);
        } else {
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
            return this.initComponents(handleTreeData(components, undefined, true));
        }
    }

    async initComponents(dataArray: IOutComponent[]) {
        this.textWrapDom.innerHTML = "";
        this.idCacheMap.clear();
        this.layerCacheMap.clear();
        this.portCacheMap.clear();
        this.componentArray.length = 0;
        this.selectedObjectArray.length = 0;
        this.activeComponentContainer.removeChildren();
        const promises: Promise<void>[] = [];
        const ports: { ports: IPort[]; componentName: string }[] = [];

        let activeComponentName: string | undefined = undefined;
        const generateComponent = (data: IOutComponent, isTopLevel = false) => {
            if (data.ports) {
                ports.push({ ports: data.ports, componentName: data.name });
            }
            const container = new Container();
            container.name = data.name;
            let targetMapObjArray = this.idCacheMap.get(data.id);
            if (targetMapObjArray) {
                targetMapObjArray.push(container);
            } else {
                targetMapObjArray = [container];
                this.idCacheMap.set(data.id, targetMapObjArray);
            }
            if (data.transform.repetition?.spacing) {
                const { rows, columns, spacing } = data.transform.repetition;
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < columns; j++) {
                        const container2 = new Container();
                        container2.name = "repetition-container";
                        container.addChild(container2);
                        data.polyData.forEach((p) => {
                            const comp = new Component(p);
                            promises.push(comp.textureLoadPromise);
                            comp.viewObject.position.set(j * spacing[0], i * spacing[1]);
                            container2.addChild(comp.viewObject);

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
                            container2.addChild(childrenContainer);
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
                activeComponentName = data.name;
            }
            if (data.selected) {
                function ifParentActive(data: any): boolean {
                    return data.dblSelected || (data.parent && ifParentActive(data.parent));
                }
                const containers = this.idCacheMap.get(data.id)!;
                if (ifParentActive(data)) {
                    this.selectedObjectArray.push(...containers);
                    this.selectComponentName = data.name;
                }
            }
            if (!isTopLevel) {
                const ac = generateActiveComponent(this.activeComponentContainer, data, generateComponent);
                if (ac) {
                    targetMapObjArray.push(ac);
                }
            }
            return container;
        };
        dataArray.forEach((data) => {
            this.componentArray.push(generateComponent(data, true));
        });
        regeneratePort(ports, this.portContainer, this.portCacheMap);
        await Promise.all(promises);
        this.reverseContainer.name = "reverse-container";
        this.reverseContainer.scale.y = -1;

        this.activeComponentContainer.scale.y = -1;
        this.activeComponentContainer.visible = false;

        this.portContainer.scale.y = -1;

        this.reverseContainer.removeChildren();

        this.componentArray.forEach((c) => {
            this.reverseContainer.addChild(c);
        });

        this.selectContainer.name = "select-bound-container";
        this.portContainer.name = "port-container";
        this.activeComponentContainer.name = "active-component-container";

        if (!this.stage) {
            const rect = this.reverseContainer.getBounds();
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
            this.stage.removeChildren();
            const rect = this.reverseContainer.getBounds();
            this.stage.scale.set(0.4 * Math.min(this.w / rect.width, this.h / rect.height));
            this.stage.moveCenter(rect.x + rect.width / 2, rect.y + rect.height / 2);
        }

        this.stage.addChild(this.reverseContainer);
        this.stage.addChild(this.activeComponentContainer);
        this.stage.addChild(this.selectContainer);
        this.stage.addChild(this.portContainer);

        const regenerateTexts = () => {
            this.textWrapDom.innerHTML = "";
            this.selectContainer.children.forEach((s) => {
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
        this.resizeCallback.regenerateTexts = regenerateTexts;
        this.stage.on("moved", () => Object.values(this.resizeCallback).forEach((f) => f()));

        if (activeComponentName) {
            showComponentPorts(this.portContainer, activeComponentName, this.portCacheMap);
        }
        this.generateSelectBound();
        regenerateTexts();
    }

    generateSelectBound() {
        this.selectContainer.removeChildren();
        if (this.stage) {
            const activeContainerIndex = this.stage.children.indexOf(this.activeComponentContainer);
            this.stage.removeChild(this.reverseContainer);
            this.stage.removeChild(this.activeComponentContainer);
            const boundGraphicsArray: Graphics[] = [];
            this.selectedObjectArray.forEach((c: Container) => {
                if (c.visible) {
                    const targetOs = c.children.every((cc) => cc.name === "repetition-container") ? c.children : [c];
                    function getParentVisible(obj: DisplayObject): boolean {
                        if (obj.parent) {
                            return obj.visible && getParentVisible(obj.parent);
                        } else {
                            return obj.visible;
                        }
                    }
                    targetOs.forEach((cc) => {
                        if (getParentVisible(cc)) {
                            const boundGraphics = new Graphics();
                            const rect = cc.getBounds();
                            boundGraphics.lineStyle(1, 0x000000);
                            boundGraphics.beginFill(0xffffff, 0.7);
                            boundGraphics.line.native = true;
                            boundGraphics.drawRect(rect.x, rect.y, rect.width, rect.height);
                            boundGraphics.endFill();

                            boundGraphicsArray.push(boundGraphics);
                        }
                    });
                }
            });
            this.stage.addChildAt(this.reverseContainer, 0);
            this.stage.addChildAt(this.activeComponentContainer, activeContainerIndex);
            boundGraphicsArray.forEach((c) => {
                this.selectContainer.addChild(c);
            });
            Object.values(this.resizeCallback).forEach((f) => f());
        }
    }

    unSelectComponent() {
        this.selectComponentName = "";
        this.selectedObjectArray.length = 0;
        this.textWrapDom.innerHTML = "";
        this.selectContainer.removeChildren();
    }
}
