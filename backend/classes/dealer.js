import { Pack } from "./pack.js";

export class Dealer {
    constructor(clients = new Map()) {
        this.pack = new Pack();
        this.players = clients;
        this.cards = [];
        this.hiddenCard = null;
    }

    broadcast(message) {
        try {
            for (const [name, ws] of this.players.entries()) {
                ws.send(message);
            }
        } catch (e) {
            return;
        }
    }

    startDealer() {
        this.cards = [this.pack.pullCard(), this.pack.pullCard()];
    }

    giveInitialCards() {
        const cards = [this.pack.pullCard(), this.pack.pullCard()];
        return cards;
    }

    hit(ws) {
        const card = this.pack.pullCard();
        ws.cards.push(card);
        this.broadcast(
            JSON.stringify({
                type: "hit",
                card: { value: card.value, suit: card.suit },
                name: ws.name,
            })
        );
    }

    bid(ammount, ws) {
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

    resetPack() {
        this.pack = new this.pack.constructor();
        this.cards = [];
    }
}
