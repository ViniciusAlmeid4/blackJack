export class Table {
    constructor(clients, dealer, line = new Map(), order = []) {
        this.clients = clients; // currently playing
        this.dealer = dealer;
        this.line = line; // waiting line
        this.playing = false;
        this.turn = 0;
    }

    startGame() {
        for (const [name, ws] of this.line.entries()) {
            this.clients.set(name, ws);
        }

        this.line.clear();

        this.playing = true;
        this.dealer.startDealer();
        this.order = [];
        this.clients.keys().forEach((players) => {
            this.order.push(players);
        });
        console.log("dealer: " + this.dealer.cards);
        for (const [name, ws] of this.clients.entries()) {
            ws.cards = this.dealer.giveInitialCards();
            console.log(name + ": " + ws.cards);
        }
        console.log("Game started with players:", [...this.clients.keys()]);
    }

    addPlayer(name, ws) {
        ws.name = name;
        ws.cards = [];
        ws.confirmed = false;
        if (this.playing) {
            this.line.set(name, ws);
            return "queue";
        } else {
            this.clients.set(name, ws);
            return "table";
        }
    }

    confirmPlayer(name) {
        const ws = this.clients.get(name);
        if (!ws || this.playing) {
            return;
        }
        ws.confirmed = true;
        for (const [name, ws] of this.clients.entries()) {
            if (ws.confirmed == false) {
                return;
            }
        }
        this.startGame();
    }

    passTurn() {
        this.turn++;
        if (this.turn >= this.order.length) {
            this.turn = 0;
            this.line = [];
            console.log('entra o dealer');
        }
    }

    currentTurn() {
        return this.order[this.turn];
    }

    removePlayer() {
        this.clients.delete(ws.name);
        this.line.delete(ws.name);
        this.order = this.order.filter((player) => player !== ws.name);
    }

    endGame() {
        this.playing = false;
        for (const [name, ws] of this.clients.entries()) {
            ws.confirmed = false;
        }
    }
}
