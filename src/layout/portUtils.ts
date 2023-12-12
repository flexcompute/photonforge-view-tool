import { Container, Graphics } from "pixi.js";
import { IComponent, IPort } from "..";
import { IPortInfoInMap } from "./LayoutViewTool";
import { Viewport } from "pixi-viewport";
import { addDetectedPorts, removeDetectedPorts } from "./PortCommand";

export function drawOnePort(p: IPort) {
    function drawPortLine(portLine: Graphics, p: IPort) {
        portLine.moveTo(0, -p.spec.width / 2);
        portLine.lineTo(0, p.spec.width / 2);

        const halfA = 0.2;
        portLine.moveTo(0, -halfA);
        portLine.lineTo(0, halfA);
        portLine.lineTo(1.5 * halfA, 0);
        portLine.lineTo(0, -halfA);
    }
    const onePortContainer = new Container();
    onePortContainer.name = "one port";

    const portLine = new Graphics();
    portLine.lineStyle(0.12, 0x820080);
    drawPortLine(portLine, p);

    const portLine2 = new Graphics();
    portLine2.lineStyle(1, 0x820080);
    portLine2.line.native = true;
    drawPortLine(portLine2, p);

    portLine.position.set(p.center.x, p.center.y);
    portLine.rotation = -(p.input_direction * Math.PI) / 180;
    portLine2.position.set(p.center.x, p.center.y);
    portLine2.rotation = -(p.input_direction * Math.PI) / 180;

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
    const portContainers = portCacheMap.get(componentName)!.map((d) => d.obj);
    if (portContainers) {
        portContainers.forEach((p) => {
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
    portCacheMap: Map<string, IPortInfoInMap[]>,
    portContainer: Container,
    stage: Viewport,
    detectPortsCallback: (port: any) => {},
) {
    const newPorts = targetComponent.rscp?.find((d) => d.text === "Ports")?.children;
    if (commandType === "port remove") {
        const ports = portCacheMap.get(targetComponent.name)!;
        if (newPorts) {
            let deleteIndex;
            ports.forEach((p, index) => {
                if (!newPorts.map((d) => d.id).includes(p.obj.name)) {
                    p.obj.parent.removeChild(p.obj);
                    p.obj.destroy();
                    deleteIndex = index;
                }
            });
            if (deleteIndex) {
                ports.splice(deleteIndex, 1);
            }
        }
    } else if (commandType === "port add") {
        const ports = portCacheMap.get(targetComponent.name)!;
        if (newPorts) {
            newPorts.forEach((p) => {
                if (!ports.map((d) => d.obj.name).includes(p.id)) {
                    const onePortContainer = drawOnePort(p);
                    ports.push({ name: targetComponent.name, obj: onePortContainer });
                    onePortContainer.name = p.id;
                    portContainer!.addChild(onePortContainer);
                }
            });
            showComponentPorts(portContainer, targetComponent.name, portCacheMap, newPorts);
        }
    } else if (commandType === "port hidden") {
        showComponentPorts(portContainer, targetComponent.name, portCacheMap, newPorts);
    } else if (commandType === "detect ports") {
        addDetectedPorts(stage, targetComponent.detectPorts, detectPortsCallback);
    } else if (commandType === "undetect ports" || commandType === "detect ports finished") {
        removeDetectedPorts(stage);
    } else if (commandType === "port click") {
        const clickItem = targetComponent.rscp?.find((d) => d.text === "Ports")?.clickItem;
        if (clickItem) {
        } else {
            portCacheMap.get(targetComponent.name)!.forEach((p) => {
                const target = p.obj.getChildByName("name-text");
                if (target) {
                    p.obj.removeChild(target);
                }
            });
        }
    } else {
        if (newPorts) {
            regeneratePort([{ componentName: targetComponent.name, ports: newPorts }], portContainer, portCacheMap);
        }
    }
}
