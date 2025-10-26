class Carta {
  constructor(valor, naipe) {
    this.valor = valor;
    this.naipe = naipe;
  }

  getValorBlackjack() {
    if (["J", "Q", "K"].includes(this.valor)) {
      return 10;
    } else if (this.valor === "A") {
      return 11; // o tratamento do Ás como 1 pode ser feito na lógica do jogo
    } else {
      return parseInt(this.valor);
    }
  }

  toString() {
    return `${this.valor} de ${this.naipe}`;
  }
}

class Baralho {
  constructor() {
    const valores = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const naipes = ["Copas", "Ouros", "Espadas", "Paus"];

    this.cartas = [];

    for (const valor of valores) {
      for (const naipe of naipes) {
        this.cartas.push(new Carta(valor, naipe));
      }
    }

    this.embaralhar();
  }

  embaralhar() {
    // Fisher-Yates shuffle (algoritmo de embaralhamento justo)
    for (let i = this.cartas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
    }
  }

  puxarCarta() {
    return this.cartas.pop();
  }

  cartasRestantes() {
    return this.cartas.length;
  }
}

// Exporta as classes para usar no servidor
module.exports = { Carta, Baralho };