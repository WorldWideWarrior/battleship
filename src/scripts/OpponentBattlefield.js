import { Battlefield } from './Battlefield';

export class OpponentBattlefield extends Battlefield {
    constructor(table) {
        super(table);
    }

    onClickOnField(x, y) {
        console.debug(`Click on opponent: ${x}, ${y}`);
    }
}
