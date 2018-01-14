import { Battlefield } from './Battlefield';

class OwnBattlefield extends Battlefield {
    constructor(table) {
        super(table);
    }

    onClickOnField(x, y) {
        //ignore
    }
}

module.exports = OwnBattlefield;
