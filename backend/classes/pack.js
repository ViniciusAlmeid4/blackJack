export class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
    }

    toString() {
        return `${this.value} of ${this.suit}`;
    }
}

export class Pack {
    constructor() {
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const suites = ["Hearts", "Diamonds", "Spades", "Clubs"];

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
