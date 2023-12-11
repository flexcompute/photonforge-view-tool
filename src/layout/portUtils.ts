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

    onePortContainer.position.set(p.center.x, p.center.y);
    onePortContainer.rotation = -(p.input_direction * Math.PI) / 180;

    const portLine = new Graphics();
    portLine.lineStyle(0.12, 0x820080);
    drawPortLine(portLine, p);

    const portLine2 = new Graphics();
    portLine2.lineStyle(1, 0x820080);
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
    portContainer.removeChildren();
    portsData.forEach((pd) => {
        const { ports } = pd;
        const portArray: { name: string; obj: Container }[] = [];
        portCacheMap.set(pd.componentName, portArray);
        ports.forEach((p) => {
            const onePortContainer = drawOnePort(p);
            onePortContainer.visible = false;
            portArray.push({ name: pd.componentName, obj: onePortContainer });
            onePortContainer.name = p.id;
            portContainer!.addChild(onePortContainer);
        });
    });
}

export function showComponentPorts(
    container: Container,
    componentName: string,
    portCacheMap: Map<string, IPortInfoInMap[]>,
) {
    container.children.forEach((c) => {
        c.visible = false;
    });
    const portContainers = portCacheMap.get(componentName)!.map((d) => d.obj);
    if (portContainers) {
        portContainers.forEach((p) => {
            p.visible = true;
        });
    }
}

export function handlePortsCommand(
    commandType: "port add" | "port remove" | "detect ports" | "undetect ports" | "detect ports finished",
    targetComponent: IComponent,
    portCacheMap: Map<string, IPortInfoInMap[]>,
    portContainer: Container,
    stage: Viewport,
    detectPortsCallback: (port: any) => {},
) {
    if (commandType === "port remove") {
        const ports = portCacheMap.get(targetComponent.name)!;
        const newPorts = targetComponent.rscp?.find((d) => d.text === "Ports")?.children;

        if (newPorts) {
            ports.forEach((p) => {
                if (!newPorts.map((d) => d.id).includes(p.obj.name)) {
                    p.obj.parent.removeChild(p.obj);
                    p.obj.destroy();
                }
            });
        }
    } else if (commandType === "port add") {
        regeneratePort(
            [
                {
                    componentName: targetComponent.name,
                    ports: targetComponent.rscp?.find((d) => d.text === "Ports")!.children!,
                },
            ],
            portContainer,
            portCacheMap,
        );
        showComponentPorts(portContainer, targetComponent.name, portCacheMap);
    } else if (commandType === "detect ports") {
        addDetectedPorts(stage, targetComponent.detectPorts, detectPortsCallback);
    } else if (commandType === "undetect ports" || commandType === "detect ports finished") {
        removeDetectedPorts(stage);
    }
}
