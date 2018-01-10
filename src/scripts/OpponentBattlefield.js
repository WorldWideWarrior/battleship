import { Battlefield } from './Battlefield';

export class OpponentBattlefield extends Battlefield {
    constructor(table, socket) {
        super(table);
        this.socket = socket;
    }

    onClickOnField(x, y) {
        if(this.activated)
            this.socket.emit("shot-at", x, y);
    }
}
