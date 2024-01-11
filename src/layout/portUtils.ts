import { Container, Graphics } from "pixi.js";
import { IComponent, IPort } from "..";
import LayoutViewTool, { IPortInfoInMap } from "./LayoutViewTool";
import { addDetectedPorts, removeDetectedPorts } from "./PortCommand";

export function drawPortLine(portLine: Graphics, p: IPort) {
    portLine.moveTo(0, -p.spec.width / 2);
    portLine.lineTo(0, p.spec.width / 2);

    const halfA = 0.2;
    portLine.moveTo(0, -halfA);
    portLine.lineTo(0, halfA);
    portLine.lineTo(1.5 * halfA, 0);
    portLine.lineTo(0, -halfA);
}

export function drawOnePort(p: IPort, color = 0x820080) {
    const onePortContainer = new Container();
    onePortContainer.name = "one port";

    onePortContainer.position.set(p.center.x, p.center.y);
    onePortContainer.rotation = (p.input_direction * Math.PI) / 180; // SCEM-4834

    const portLine = new Graphics();
    portLine.lineStyle(0.12, color);
    drawPortLine(portLine, p);

    const portLine2 = new Graphics();
    portLine2.lineStyle(1, color);
    portLine2.line.native = true;
    drawPortLine(portLine2, p);

    onePortContainer.addChild(portLine, portLine2);
    return onePortContainer;
}

export function regeneratePort(
    portsData: { ports: IPort[]; componentName: string }[],
    portContainer: Container,
    portCacheMap: Map<string, IPortInfoInMap[]>,
) {
    portsData.forEach((pd) => {
        const oldPorts = portCacheMap.get(pd.componentName);
        if (oldPorts) {
            oldPorts.map((pd2) => pd2.obj).forEach((p) => portContainer.removeChild(p));
        }
        const { ports } = pd;
        const portArray: { name: string; obj: Container }[] = [];
        portCacheMap.set(pd.componentName, portArray);
        ports.forEach((p) => {
            const onePortContainer = drawOnePort(p);
            onePortContainer.visible = !p.hidden;
            portArray.push({ name: p.name, obj: onePortContainer });
            onePortContainer.name = p.id;
            portContainer!.addChild(onePortContainer);
        });
    });
}

export function showComponentPorts(
    container: Container,
    componentName: string,
    portCacheMap: Map<string, IPortInfoInMap[]>,
    ports?: IPort[],
) {
    container.children.forEach((c) => {
        c.visible = false;
    });
    const portArray = portCacheMap.get(componentName)!.map((d) => d.obj);
    if (portArray) {
        portArray.forEach((p) => {
            p.visible = ports ? !ports.find((p1) => p1.id === p.name)!.hidden : true;
        });
    }
}

export function handlePortsCommand(
    commandType:
        | "port add"
        | "port remove"
        | "detect ports"
        | "undetect ports"
        | "detect ports finished"
        | "port hidden",
    targetComponent: IComponent,
    layoutViewTool: LayoutViewTool,
) {
    const { portCacheMap, portContainer, stage, detectPortsCallback } = layoutViewTool;
    const newPorts = targetComponent.rscp?.find((d) => d.text === "Ports")?.children;
    if (commandType === "port remove") {
        const ports = portCacheMap.get(targetComponent.name)!;
        if (newPorts) {
            let deleteIndex;
            ports.forEach((p, index) => {
                if (!newPorts.map((d) => d.id).includes(p.obj.name)) {
                    portContainer.removeChild(p.obj);
                    p.obj.destroy();
                    deleteIndex = index;
                }
            });
            if (deleteIndex !== undefined) {
                ports.splice(deleteIndex, 1);
            }
            Object.values(layoutViewTool.resizeCallback).forEach((f) => f());
        }
    } else if (commandType === "port add") {
        const ports = portCacheMap.get(targetComponent.name)!;
        if (newPorts) {
            newPorts.forEach((p) => {
                if (!ports.map((d) => d.obj.name).includes(p.id)) {
                    const onePortContainer = drawOnePort(p);
                    ports.push({ name: p.name, obj: onePortContainer });
                    onePortContainer.name = p.id;
                    portContainer!.addChild(onePortContainer);
                }
            });
            showComponentPorts(portContainer, targetComponent.name, portCacheMap, newPorts);
        }
    } else if (commandType === "port hidden") {
        showComponentPorts(portContainer, targetComponent.name, portCacheMap, newPorts);
        Object.values(layoutViewTool.resizeCallback).forEach((f) => f());
    } else if (commandType === "detect ports") {
        addDetectedPorts(stage!, targetComponent.detectPorts, detectPortsCallback);
    } else if (commandType === "undetect ports" || commandType === "detect ports finished") {
        removeDetectedPorts(stage!);
    } else if (commandType === "port rename") {
        Object.values(layoutViewTool.resizeCallback).forEach((f) => f());
    } else if (commandType === "port click") {
        const clickItem = targetComponent.rscp?.find((d) => d.text === "Ports")?.clickItem;
        if (clickItem) {
            layoutViewTool.resizeCallback.portTextCallback = () => {
                const s = portContainer.getChildByName(clickItem.id);
                if (!s) {
                    return;
                }
                const rect = s.getBounds();
                if (!s.visible || rect.width === 0) {
                    return;
                }
                const x = (rect.x + rect.width / 2) / layoutViewTool.app.screen.width;
                const y = (rect.y + rect.height / 2) / layoutViewTool.app.screen.height;
                const textNode = document.createTextNode(clickItem.name);
                const textElement = document.createElement("span");
                textElement.appendChild(textNode);
                textElement.style.position = "absolute";
                textElement.style.fontWeight = "bold";
                textElement.style.fontSize = "18px";
                textElement.style.pointerEvents = "none";
                textElement.style.left = `calc(${x * 100}% + 3px)`;
                textElement.style.top = `${y * 100}%`;
                textElement.style.transform = "translate(0, -100%)";
                textElement.style.userSelect = "none";
                layoutViewTool.textWrapDom.appendChild(textElement);
            };
            Object.values(layoutViewTool.resizeCallback).forEach((f) => f());
        } else {
            delete layoutViewTool.resizeCallback.portTextCallback;
            Object.values(layoutViewTool.resizeCallback).forEach((f) => f());
        }
    } else {
        if (newPorts) {
            regeneratePort([{ componentName: targetComponent.name, ports: newPorts }], portContainer, portCacheMap);
            Object.values(layoutViewTool.resizeCallback).forEach((f) => f());
        }
    }
}
