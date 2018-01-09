import { Battlefield } from './Battlefield';

export class OpponentBattlefield extends Battlefield {
    constructor(table) {
        super(table);
    }

    onClickOnField(x, y) {
        //do nothing
    }
}
