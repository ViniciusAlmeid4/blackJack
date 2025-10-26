import { Baralho } from "./baralho.js";

export class JogoBlackjack {
  constructor() {
    this.baralho = new Baralho();
    this.jogadores = new Map(); // { id: [cartas] }
    this.dealer = [];
    this.cartaOcultaDealer = null;
  }

  // Dar as cartas iniciais do dealer (uma virada)
  darCartasIniciaisDealer() {
    const cartas = [this.baralho.puxarCarta(), this.baralho.puxarCarta()];
    this.dealer = [cartas[0]];
    this.cartaOcultaDealer = cartas[1];
    return {
      visiveis: [cartas[0]],
      ocultas: ["oculta"]
    };
  }

  // Dar as duas cartas iniciais para o jogador
  darCartasIniciaisJogador(jogadorId) {
    const cartas = [this.baralho.puxarCarta(), this.baralho.puxarCarta()];
    this.jogadores.set(jogadorId, cartas);
    return cartas;
  }

  // Revelar a carta virada do dealer
  revelarCartaDealer() {
    if (this.cartaOcultaDealer) {
      this.dealer.push(this.cartaOcultaDealer);
      this.cartaOcultaDealer = null;
    }
    return this.dealer;
  }

  // Jogador pede uma carta (“Hit”)
  pedirCarta(jogadorId) {
    const carta = this.baralho.puxarCarta();
    const mao = this.jogadores.get(jogadorId) || [];
    mao.push(carta);
    this.jogadores.set(jogadorId, mao);
    return carta;
  }

  // Calcular pontuação de uma mão
  calcularPontuacao(cartas) {
    let total = 0;
    let ases = 0;

    for (const carta of cartas) {
      if (["J", "Q", "K"].includes(carta.valor)) total += 10;
      else if (carta.valor === "A") {
        total += 11;
        ases++;
      } else {
        total += parseInt(carta.valor);
      }
    }

    // Se estourar 21 e houver Ás, converte 11 → 1 até parar de estourar
    while (total > 21 && ases > 0) {
      total -= 10;
      ases--;
    }

    return total;
  }
}