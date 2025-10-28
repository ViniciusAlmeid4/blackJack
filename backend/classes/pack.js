export class Card {
    constructor(valor, naipe) {
        this.value = valor;
        this.suit = naipe;
    }

    getValorBlackjack() {
        if (["J", "Q", "K"].includes(this.value)) {
            return 10;
        } else if (this.value === "A") {
            return 11;
        } else {
            return parseInt(this.valor);
        }
    }

    toString() {
        return `${this.value} de ${this.suit}`;
    }
}

export class Pack {
    constructor() {
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const suites = ["Copas", "Ouros", "Espadas", "Paus"];

        this.cards = [];

        for (const value of values) {
            for (const suit of suites) {
                this.cards.push(new Card(value, suit));
            }
        }

        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    pullCard() {
        return this.cards.pop();
    }

    cardsLeft() {
        return this.cards.length;
    }
}
