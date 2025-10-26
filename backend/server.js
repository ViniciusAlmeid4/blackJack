import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
    console.log("Novo cliente conectado");

    ws.on("message", (message) => {
        console.log(`Recebido: ${message}`);
        ws.send(`Você disse: ${message}`);
    });

    ws.on("close", () => console.log("Cliente desconectado"));
});
