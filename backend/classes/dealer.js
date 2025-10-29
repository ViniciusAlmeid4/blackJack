import { Pack } from "./pack.js";

export class Dealer {
    constructor(clients = new Map()) {
        this.pack = new Pack();
        this.players = clients;
        this.cards = [];
        this.hiddenCard = null;
    }

    startDealer() {
        this.cards = [this.pack.pullCard(), this.pack.pullCard()];
    }

    giveInitialCards() {
        const cards = [this.pack.pullCard(), this.pack.pullCard()];
        return cards;
    }

    hit(name) {
        const card = this.pack.pullCard();
        const player = this.players.get(name);
        player.cards.push(card);
        console.log(name + " hit: " + card);
        return card;
    }

    bid(ammount, name) {
        ws = this.players.get(name);
        ws.stack -= ammount;
        ws.bid = ammount;
    }

    calculateScore(cards) {
        let total = 0;
        let ases = 0;

        for (const card of cards) {
            if (["J", "Q", "K"].includes(card.value)) {
                total += 10;
            } else if (card.value === "A") {
                total += 11;
                ases++;
            } else {
                total += parseInt(card.value);
            }
        }

        while (total > 21 && ases > 0) {
            total -= 10;
            ases--;
        }

        return total;
    }
}
