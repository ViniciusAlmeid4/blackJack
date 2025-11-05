import { parse } from "url";
import { WebSocketServer } from "ws";
import { Table } from "./classes/table.js";
import { Dealer } from "./classes/dealer.js";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();

const dealer = new Dealer(clients);

const table = new Table(clients, dealer);

function broadcast(message) {
    try {
        wss.clients.forEach((client) => {
            client.send(message);
        });
    } catch (e) {
        return;
    }
}

wss.on("connection", (ws, req) => {
    const { query } = parse(req.url, true);
    if (!query.name && query.name.trim().toLocaleLowerCase() != "dealer") {
        ws.close(4001, "User name missong or same as dealer");
        return;
    }
    if (table.clients.has(query.name)) {
        ws.close(4001, "User name already in use");
        return;
    }

    const place = table.addPlayer(query.name, ws);

    ws.on("message", (msg) => {
        let json = null;
        try {
            json = JSON.parse(msg);
        } catch ($e) {
            ws.send(
                JSON.stringify({
                    type: "error",
                    code: 1,
                    message: "server canot understand messages unless they're JSON's",
                })
            );
            return;
        }

        switch (json.action) {
            case "hit":
                if (!table.playing) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 2,
                            message: "table not in game",
                        })
                    );
                    return;
                }
                if (ws.name !== table.currentTurn()) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 4,
                            message: `not ${ws.name}'s turn, awaitin for ${table.currentTurn()}`,
                        })
                    );
                    return;
                }
                table.hit(ws);
                break;
            case "stand":
                if (!table.playing) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 2,
                            message: "table not in game",
                        })
                    );
                    return;
                }
                if (ws.name !== table.currentTurn()) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 4,
                            message: `not ${ws.name}'s turn, awaitin for ${table.currentTurn()}`,
                        })
                    );
                    return;
                }
                table.passTurn(ws);
                break;
            case "bid":
                break;
            case "confirm":
                if (table.playing) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 3,
                            message: "table already in game",
                        })
                    );
                    return;
                }
                if (table.confirmPlayer(ws.name)) {
                    broadcast(
                        JSON.stringify({
                            type: "userConfirmed",
                            name: ws.name,
                        })
                    );
                }
                if (table.checkForStart()) {
                    table.startGame();
                }
                break;
            default:
                ws.send(
                    JSON.stringify({
                        type: "error",
                        code: 0,
                        message: "invalid action",
                    })
                );
                break;
        }
    });

    ws.on("close", () => {
        table.removePlayer(ws);
        broadcast(
            JSON.stringify({
                type: "userRemoved",
                name: ws.name,
            })
        );
    });
});
