import { Battlefield } from './Battlefield';

export class OpponentBattlefield extends Battlefield {
    constructor(table, socket) {
        super(table);
        this.socket = socket;
    }

    onClickOnField(x, y) {
        this.socket.emit("shot-at", x, y);
    }
}
