import { Battlefield } from './Battlefield';

export class OwnBattlefield extends Battlefield {
    constructor(table) {
        super(table);
    }

    onClickOnField(x, y) {
        console.debug(`Click on own: ${x}, ${y}`);
    }
}
