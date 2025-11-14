import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "url";
import { WebSocketServer } from "ws";
import { Table } from "./classes/table.js";
import { Dealer } from "./classes/dealer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const httpServer = http.createServer((req, res) => {
    let filePath = path.join(__dirname, "", req.url === "/" ? "index.html" : req.url);

    let ext = path.extname(filePath);
    let contentType = "text/html";

    switch (ext) {
        case ".js":
            contentType = "application/javascript";
            break;
        case ".css":
            contentType = "text/css";
            break;
        case ".json":
            contentType = "application/json";
            break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end("File not found");
            return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    });
});

httpServer.listen(8081, () => {
    console.log("HTTP server rodando em http://localhost:8081 - Troque localhost pelo ip do servidor para acessar por outros dispositivos");
});

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket rodando na porta 8080")

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
                if (table.playing) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 3,
                            message: "table already in game, cannot bid",
                        })
                    );
                    return;
                }

                const bidAmount = json.amount;
                if (!bidAmount || typeof bidAmount !== "number" || bidAmount <= 0 || !Number.isInteger(bidAmount)) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 5,
                            message: "invalid bid amount, must be a positive integer",
                        })
                    );
                    return;
                }

                try {
                    table.placeBid(ws.name, bidAmount);

                    broadcast(
                        JSON.stringify({
                            type: "playerBid",
                            name: ws.name,
                            amount: bidAmount,
                        })
                    );
                } catch (e) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 6,
                            message: e.message || "bid rejected by table",
                        })
                    );
                }
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
                if (ws.bid <= 0) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            code: 7,
                            message: "can't confirm without placing a bid!!",
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
