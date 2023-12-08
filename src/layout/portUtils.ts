import { Container, Graphics } from "pixi.js";
import { IComponent, IPort } from "..";
import { IPortInfoInMap } from "./LayoutViewTool";

export function regeneratePort(
    portsData: { ports: IPort[]; componentName: string }[],
    portContainer: Container,
    portCacheMap: Map<string, IPortInfoInMap[]>,
) {
    function drawPort(portLine: Graphics, p: IPort) {
        portLine.moveTo(0, -p.spec.width / 2);
        portLine.lineTo(0, p.spec.width / 2);

        const halfA = 0.2;
        portLine.moveTo(0, -halfA);
        portLine.lineTo(0, halfA);
        portLine.lineTo(1.5 * halfA, 0);
        portLine.lineTo(0, -halfA);
    }

    portContainer.removeChildren();
    portsData.forEach((pd) => {
        const { ports } = pd;
        const portArray: { name: string; obj: Container }[] = [];
        portCacheMap.set(pd.componentName, portArray);
        ports.forEach((p) => {
            const onePortContainer = new Container();
            onePortContainer.name = "one port";
            onePortContainer.visible = false;
            portArray.push({ name: pd.componentName, obj: onePortContainer });

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

            onePortContainer.addChild(portLine, portLine2);
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
    commandType: "port add" | "port remove",
    targetComponent: IComponent,
    portCacheMap: Map<string, IPortInfoInMap[]>,
    portContainer: Container,
) {
    if (commandType === "port remove") {
        const ports = portCacheMap.get(targetComponent.name)!;
        const newPorts = targetComponent.rscp?.find((d) => d.text === "Ports")?.children;

        if (newPorts) {
            ports.forEach((p) => {
                if (!newPorts.map((d) => d.id).includes(p.name)) {
                    p.obj.parent.removeChild(p.obj);
                    p.obj.destroy();
                    portCacheMap.delete(p.name);
                }
            });
        }
    } else {
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
    }
}
