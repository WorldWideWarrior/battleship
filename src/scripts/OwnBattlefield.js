import { Battlefield } from './Battlefield';

export class OwnBattlefield extends Battlefield {
    constructor(table, socket) {
        super(table);
    }

    onClickOnField(x, y) {
        console.debug(`Click on own: ${x}, ${y}`);
        this.socket.emit("shot-at", x, y);
    }
}
