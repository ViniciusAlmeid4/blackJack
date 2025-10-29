export class Table {
    constructor(clients, dealer, line = new Map(), order = []) {
        this.clients = clients; // currently playing
        this.dealer = dealer;
        this.line = line; // waiting line
        this.playing = false;
        this.turn = 0;
        this.order = [];
    }

    startGame() {
        this.playing = true;
        this.dealer.startDealer();
        this.order = [];
        this.clients.keys().forEach((players) => {
            this.order.push(players);
        });
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
        ws.stack = 500.0;
        ws.bid = 0;
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
            return false;
        }
        ws.confirmed = true;
    }

    checkForStart() {
        for (const [name, ws] of this.clients.entries()) {
            if (ws.confirmed == false) {
                return false;
            }
        }
        return true;
    }

    passTurn() {
        this.turn++;
        if (this.turn >= this.order.length) {
            this.turn = 0;
            while (this.dealer.calculateScore(this.dealer.cards) < 16) {
                const card = this.dealer.pack.pullCard();
                console.log("Dealer hit: " + card);
                this.dealer.cards.push(card);
            }
            for (const [name, ws] of this.clients.entries()) {
                console.log(name + " had: " + this.dealer.calculateScore(ws.cards));
                console.log(name + " had: " + ws.cards);
            }
            console.log("dealer ended with: " + this.dealer.calculateScore(this.dealer.cards));
            console.log("dealer ended with: " + this.dealer.cards);
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
        for (const [name, ws] of this.clients.entries()) {
            ws.confirmed = false;
            ws.cards = [];
        }
        this.dealer.cards = [];

        for (const [name, ws] of this.line.entries()) {
            this.clients.set(name, ws);
            console.log(`${name} entrou no jogo`);
        }
        this.line.clear();

        // TODO adicionar função de resetar o baralho
    }
}
