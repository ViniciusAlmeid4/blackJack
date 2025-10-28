import { parse } from "url";
import { WebSocketServer } from "ws";
import { Table } from "./classes/table.js";
import { Dealer } from "./classes/dealer.js";

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();

const dealer = new Dealer(clients);

const table = new Table(clients, dealer);

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
        let json = null;
        try {
            json = JSON.parse(msg);
        } catch ($e) {
            return;
        }

        switch (json.type) {
            case "hit":
                if (!table.playing) {
                    console.log("table not in game");
                    return;
                }
                if (ws.name !== table.currentTurn()) {
                    console.log(`not ${ws.name}'s turn, awaitin for ${table.currentTurn()}`);
                    return;
                }
                const card = dealer.hit(ws.name);
                ws.send(
                    JSON.stringify({
                        type: "hit",
                        card: { value: card.valor, suit: card.naipe },
                    })
                );
                break;
            case "stand":
                if (!table.playing) {
                    console.log("table not in game");
                    return;
                }
                if (ws.name !== table.currentTurn()) {
                    console.log(`not ${ws.name}'s turn, awaitin for ${table.currentTurn()}`);
                    return;
                }
                console.log(ws.name + ": stands with " + ws.cards);
                table.passTurn();
                break;
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
                ws.send("ação inválida.");
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

/*
    const cartasDealer = jogo.revelarCartaDealer();
    const pontuacaoDealer = jogo.calcularPontuacao(cartasDealer);
    ws.send(
        JSON.stringify({
            type: "revealDealer",
            cartas: cartasDealer.map((c) => ({ valor: c.valor, naipe: c.naipe })),
            pontuacao: pontuacaoDealer,
        })
    );
*/

//     // Cartas iniciais do jogador
//     const cartasJogador = jogo.darCartasIniciaisJogador(jogadorId);
//     ws.send(JSON.stringify({
//         tipo: "cartas_iniciais_jogador",
//         cartas: cartasJogador.map(c => ({ valor: c.valor, naipe: c.naipe })),
//         pontuacao: jogo.calcularPontuacao(cartasJogador)
//     }));

//     // Cartas iniciais do dealer
//     const cartasDealer = jogo.darCartasIniciaisDealer();
//     ws.send(JSON.stringify({
//         tipo: "cartas_iniciais_dealer",
//         visiveis: cartasDealer.visiveis.map(c => ({ valor: c.valor, naipe: c.naipe })),
//         ocultas: cartasDealer.ocultas
//     }));

//     ws.on("message", (msg) => {
//         const data = JSON.parse(msg);

//         // Jogador pede carta (Hit)
//         if (data.acao === "hit") {
//             const carta = jogo.pedirCarta(jogadorId);
//             const maoAtual = jogo.jogadores.get(jogadorId);
//             ws.send(JSON.stringify({
//                 tipo: "nova_carta",
//                 carta: { valor: carta.valor, naipe: carta.naipe },
//                 pontuacao: jogo.calcularPontuacao(maoAtual)
//             }));
//         }

//         // Jogador terminou → revelar dealer
//         if (data.acao === "revelar_dealer") {
//             const cartasDealer = jogo.revelarCartaDealer();
//             const pontuacaoDealer = jogo.calcularPontuacao(cartasDealer);
//             ws.send(JSON.stringify({
//                 tipo: "dealer_revelado",
//                 cartas: cartasDealer.map(c => ({ valor: c.valor, naipe: c.naipe })),
//                 pontuacao: pontuacaoDealer
//             }));
//         }
//     });

//     ws.on("message", (message) => {
//         console.log(`Recebido: ${message}`);
//         ws.send(`Você disse: ${message}`);
//     });

//     ws.on("close", () => console.log("Cliente desconectado"));
// });
