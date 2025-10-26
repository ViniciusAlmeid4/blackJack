class Table {
    constructor(wss, clients = new Map(), line = new Map(), order = []) {
        this.clients = clients; // currently playing
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

        this.order = [];
        this.clients.keys().forEach((players) => {
            this.order.push(players);
        });
        console.log("Game started with players:", [...this.clients.keys()]);
    }

    addPlayer(name, ws) {
        ws.name = name;
        ws.confirmed = false;
        if (this.playing) {
            this.line.set(name, ws);
            return 'queue';
        } else {
            this.clients.set(name, ws);
            return 'table';
        }
    }

    confirmPlayer(name) {
        const ws = this.clients.get(name);
        if (!ws) {
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
        turn++;
        if (turn >= order.length) {
            turn = 0;
        }
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

export default Table;
