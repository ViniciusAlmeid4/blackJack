import { WebSocketServer } from "ws";

import { JogoBlackjack } from "./jogo.js";

const wss = new WebSocketServer({ port: 8080 });
const jogo = new JogoBlackjack();

wss.on("connection", (ws) => {
    console.log("Novo cliente conectado");

    // Cartas iniciais do jogador
    const cartasJogador = jogo.darCartasIniciaisJogador(jogadorId);
    ws.send(JSON.stringify({
        tipo: "cartas_iniciais_jogador",
        cartas: cartasJogador.map(c => ({ valor: c.valor, naipe: c.naipe })),
        pontuacao: jogo.calcularPontuacao(cartasJogador)
    }));

    // Cartas iniciais do dealer
    const cartasDealer = jogo.darCartasIniciaisDealer();
    ws.send(JSON.stringify({
        tipo: "cartas_iniciais_dealer",
        visiveis: cartasDealer.visiveis.map(c => ({ valor: c.valor, naipe: c.naipe })),
        ocultas: cartasDealer.ocultas
    }));

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        // Jogador pede carta (Hit)
        if (data.acao === "hit") {
            const carta = jogo.pedirCarta(jogadorId);
            const maoAtual = jogo.jogadores.get(jogadorId);
            ws.send(JSON.stringify({
                tipo: "nova_carta",
                carta: { valor: carta.valor, naipe: carta.naipe },
                pontuacao: jogo.calcularPontuacao(maoAtual)
            }));
        }

        // Jogador terminou → revelar dealer
        if (data.acao === "revelar_dealer") {
            const cartasDealer = jogo.revelarCartaDealer();
            const pontuacaoDealer = jogo.calcularPontuacao(cartasDealer);
            ws.send(JSON.stringify({
                tipo: "dealer_revelado",
                cartas: cartasDealer.map(c => ({ valor: c.valor, naipe: c.naipe })),
                pontuacao: pontuacaoDealer
            }));
        }
    });

    ws.on("message", (message) => {
        console.log(`Recebido: ${message}`);
        ws.send(`Você disse: ${message}`);
    });

    ws.on("close", () => console.log("Cliente desconectado"));
});