import { Pack } from "./pack.js";

export class Dealer {
    constructor(clients) {
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
        return card;
    }

    calculateScore(cards) {
        let total = 0;
        let ases = 0; 1

        for (const card of cards) {
            if (["J", "Q", "K"].includes(card.value)) total += 10;
            else if (card.value === "A") {
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