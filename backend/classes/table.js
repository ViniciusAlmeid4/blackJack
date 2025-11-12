export class Table {
    constructor(clients, dealer, line = new Map(), order = []) {
        this.clients = clients;
        this.dealer = dealer;
        this.line = line;
        this.playing = false;
        this.turn = 0;
        this.order = [];
    }

    broadcast(message) {
        try {
            for (const [name, ws] of this.clients.entries()) {
                ws.send(message);
            }
        } catch (e) {
            return;
        }
    }

    startGame() {
        this.playing = true;
        this.dealer.startDealer();
        this.order = [];
        this.clients.keys().forEach((players) => {
            this.order.push(players);
        });
        this.broadcast(
            JSON.stringify({
                type: "startHand",
                cards: this.dealer.cards[0],
                name: "dealer",
            })
        );
        for (const [name, ws] of this.clients.entries()) {
            ws.cards = this.dealer.giveInitialCards();
            this.broadcast(
                JSON.stringify({
                    type: "startHand",
                    cards: ws.cards,
                    name,
                })
            );
        }
        // send do primeiro na vez this.order[0]
    }

    addPlayer(name, ws) {
        ws.name = name;
        ws.cards = [];
        ws.confirmed = false;
        ws.stack = 1000.0;
        ws.bid = 0;
        let place = "";
        if (this.playing) {
            this.line.set(name, ws);
            place = "queue";
        } else {
            this.clients.set(name, ws);
            place = "table";
        }
        this.broadcast(
            JSON.stringify({
                type: "userAdded",
                name: ws.name,
                where: place,
            })
        );
        for (const [name, ws2] of this.clients.entries()) {
            if (ws != ws2) {
                ws.send(
                    JSON.stringify({
                        type: "userAdded",
                        name,
                        where: "table",
                    })
                );
            }
        }
        for (const [name, ws2] of this.line.entries()) {
            if (ws != ws2) {
                ws.send(
                    JSON.stringify({
                        type: "userAdded",
                        name,
                        where: "queue",
                    })
                );
            }
        }
    }

    confirmPlayer(name) {
        const ws = this.clients.get(name);
        if (!ws || this.playing) {
            return false;
        }
        ws.confirmed = true;
    }

    placeBid(playerName, amount) {
        const ws = this.clients.get(playerName);
        if (!ws) {
            throw new Error("Player not found.");
        }

        if (this.playing) {
            throw new Error("Cannot place bid, game is already in progress.");
        }

        if (ws.bid > 0) {
            throw new Error("You have already placed a bid for this round.");
        }

        if (amount > ws.stack) {
            throw new Error(`Insufficient funds. Your stack is ${ws.stack}.`);
        }

        ws.stack -= amount;
        ws.bid = amount;
    }


    checkForStart() {
        for (const [name, ws] of this.clients.entries()) {
            if (ws.confirmed == false) {
                return false;
            }
        }
        return true;
    }

    hit(ws) {
        this.dealer.hit(ws);
        if (this.dealer.calculateScore(ws.cards) >= 21) {
            this.passTurn(ws);
        }
    }

    passTurn(ws) {
        this.turn++;
        this.broadcast(
            JSON.stringify({
                type: "stand",
                name: ws.name,
            })
        );
        // adicionar de quem é a vez atual (não sei onde fica) this.order[this.turn]
        if (this.turn >= this.order.length) {
            this.turn = 0;
            while (this.dealer.calculateScore(this.dealer.cards) < 16) {
                const card = this.dealer.pack.pullCard();
                this.dealer.cards.push(card);
                for (const [name, ws] of this.clients.entries()) {
                    ws.send(
                        JSON.stringify({
                            type: "hit",
                            card: { value: card.value, suit: card.suit },
                            name: "dealer",
                        })
                    );
                }
            }
            this.endGame();
        }
    }

    currentTurn() {
        return this.order[this.turn];
    }

    removePlayer(ws) {
        this.clients.delete(ws.name);
        this.line.delete(ws.name);
        this.order = this.order.filter((player) => player !== ws.name);
    }

    endGame() {
        this.playing = false;
        const dealerScore = this.dealer.calculateScore(this.dealer.cards);
        for (const [name, ws] of this.clients.entries()) {
            ws.send(
                JSON.stringify({
                    type: "showDown",
                    cards: this.dealer.cards,
                    score: dealerScore,
                    name: "dealer",
                })
            );
        }
        for (const [sender, sws] of this.clients.entries()) {
            const score = this.dealer.calculateScore(sws.cards);
            const won = score <= 21 && (dealerScore > 21 || score > dealerScore);
            for (const [reciever, rws] of this.clients.entries()) {
                rws.send(
                    JSON.stringify({
                        type: "showDown",
                        cards: sws.cards,
                        score,
                        name: sender,
                        won,
                        currentStack: sws.stack
                    })
                );
            }
        }

        for (const [name, ws] of this.clients.entries()) {
            ws.confirmed = false;
            ws.cards = [];
            ws.bid = 0;
            ws.send(
                JSON.stringify({
                    type: "gameEnded",
                })
            );
        }
        this.dealer.cards = [];

        for (const [name, ws] of this.line.entries()) {
            this.clients.set(name, ws);
            this.broadcast(
                JSON.stringify({
                    type: "userAddedFromQueue",
                    name: ws.name,
                })
            );
        }
        this.line.clear();

        this.resetPack();
    }

    resetPack() {
        this.dealer.resetPack();
    }
}
