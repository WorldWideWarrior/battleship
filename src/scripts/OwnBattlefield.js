import { Battlefield } from './Battlefield';

export class OwnBattlefield extends Battlefield {
    constructor(table) {
        super(table);
    }

    onClickOnField(x, y) {
        //ignore
    }
}
