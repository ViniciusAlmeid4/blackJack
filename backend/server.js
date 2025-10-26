import { parse } from "url";
import { WebSocketServer } from "ws";
import Table from "./classes/table.js";
import { json } from "stream/consumers";

const wss = new WebSocketServer({ port: 8080 });

const table = new Table(wss);

function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}

wss.on("connection", (ws, req) => {
    const { query } = parse(req.url, true);
    if (table.clients.has(query.name)) {
        ws.close(4001, "User name already in use");
    }

    const place = table.addPlayer(query.name, ws);
    broadcast(
        JSON.stringify({
            type: "userAdded",
            name: ws.name,
            where: place,
        })
    );

    ws.on("message", (msg) => {
        const json = JSON.parse(msg);

        switch (json.type) {
            case "confirm":
                table.confirmPlayer(ws.name);
                broadcast(
                    JSON.stringify({
                        type: "userConfirmed",
                        name: ws.name,
                    })
                );
                break;

            default:
                if (ws.name !== table.order[turn]) {
                    ws.send("não é sua vez");
                    return;
                }

                ws.send("Jogou e passou para o proximo");
                break;
        }
    });

    ws.on("close", () => {
        table.removePlayer(ws.name);
        broadcast(
            JSON.stringify({
                type: "userRemoved",
                name: ws.name,
            })
        );
    });
});
