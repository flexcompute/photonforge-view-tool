import { Container, Graphics } from "pixi.js";
import { IPort } from "..";

export function regeneratePort(
    portsData: { ports: IPort[]; componentId: string }[],
    portContainer: Container,
    idCacheMap: Map<string, Container[]>,
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
        const portArray: Container[] = [];
        idCacheMap.set(pd.componentId, portArray);
        ports.forEach((p) => {
            const onePortContainer = new Container();
            onePortContainer.name = "one port";
            onePortContainer.visible = false;
            portArray.push(onePortContainer);

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

export function showComponentPorts(container: Container, componentId: string, portCacheMap: Map<string, Container[]>) {
    container.children.forEach((c) => {
        c.visible = false;
    });
    const portContainers = portCacheMap.get(componentId)!;
    if (portContainers) {
        portContainers.forEach((p) => {
            p.visible = true;
        });
    }
}
