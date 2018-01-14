/* eslint-disable no-use-before-define */
const DEACTIVATED_CLASS = 'deactivated-field';
const ACTIVATED_CLASS = 'activated-field';

class Battlefield {
    static get width() {
        return 10;
    }
    static get height() {
        return 10;
    }

    constructor(table) {
        this.table = table;
        /**
         * two dimensional array two save a direct reference two each dom element of a $field
         * this.$field[x][y]
         * @type {jQuery[][]}
         */
        this.$field = this.generateDomField(table);
        /**
         * two dimensional array two store the current state of each field
         * this.field[x][y]
         * @type {number[][]}
         */
        this.field = Battlefield.generateEmptyField();

        this.ships = [];
        this.shots = [];

        this.activated = true;
    }

    reset() {
        this.ships = [];
        this.shots = [];
        this.updateField();
        this.activate();
    }

    deactivate() {
        this.activated = false;
        this.table.addClass(DEACTIVATED_CLASS);
        this.table.removeClass(ACTIVATED_CLASS);
    }

    activate() {
        this.activated = true;
        this.table.removeClass(DEACTIVATED_CLASS);
        this.table.addClass(ACTIVATED_CLASS);
    }

    generateDomField(table) {
        // initialize $field
        const $field = new Array(Battlefield.width);
        for (let x = 0; x < Battlefield.width; x++) {
            $field[x] = new Array(Battlefield.height);
        }

        for (let row = 0; row < Battlefield.height; row++) {
            const rowElement = $('<div class="line"/>');
            for (let column = 0; column < Battlefield.width; column++) {
                const columnElement = $('<div class="box-container"> <div class="box"/> </div>');
                columnElement.addClass(Battlefield.FIELD_CLASS[Battlefield.FIELD.SEA]);
                ((clickRow, clickColumn) => {
                    columnElement.on('click', () => {
                        this.onClickOnField(clickColumn, clickRow);
                    });
                })(row, column);

                $field[column][row] = columnElement;

                rowElement.append(columnElement);
            }
            table.append(rowElement);
        }
        return $field;
    }

    static generateEmpty2Field() {
        const field = new Array(Battlefield.width);
        for (let x = 0; x < Battlefield.width; x++) {
            field[x] = new Array(Battlefield.height);
            for (let y = 0; y < Battlefield.height; y++) {
                field[x][y] = Battlefield.FIELD.SEA;
            }
        }
        return field;
    }

    // eslint-disable-next-line class-methods-use-this
    onClickOnField(x, y) {
        console.debug(`Click: ${x}, ${y}`);
    }

    static generateFieldState(ships, shots) {
        const field = Battlefield.generateEmptyField();

        ships.forEach((ship) => {
            for (let offset = 0; offset < ship.size; offset++) {
                let x = ship.position.x;
                let y = ship.position.y;
                if (ship.orientation === 'down') {
                    y += offset;
                } else if (ship.orientation === 'right') {
                    x += offset;
                } else {
                    console.error(`unknown orientation ${ship.orientation} for ship ${ship.name}`);
                    break;
                }
                // set ship flag (this removes every other flag (in this cause, only the sea flag should previously be set)
                field[x][y] = getFieldForShipAtOffset(ship, offset);
                // ships destroyed
                if (ship.size === ship.hits) {
                    // add destroyed flag
                    field[x][y] |= Battlefield.FIELD.DESTROYED;
                }
            }
        });

        shots.forEach((shot) => {
            // remove sea flag
            field[shot.position.x][shot.position.y] &= ~Battlefield.FIELD.SEA;
            // add hit or miss Flag
            field[shot.position.x][shot.position.y] |= shot.hit ? Battlefield.FIELD.HIT : Battlefield.FIELD.MISS;
        });
        return field;
    }

    static calculateDifferencesBetweenFields(fromField, toField) {
        const differences = [];
        for (let x = 0; x < Battlefield.width; x++) {
            for (let y = 0; y < Battlefield.height; y++) {
                if (fromField[x][y] !== toField[x][y]) {
                    differences.push({
                        x,
                        y,
                        from: fromField[x][y],
                        to: toField[x][y],
                    });
                }
            }
        }
        return differences;
    }

    updateField() {
        const newField = Battlefield.generateFieldState(this.ships, this.shots);
        const differences = Battlefield.calculateDifferencesBetweenFields(this.field, newField);
        differences.forEach((difference) => {
            const $element = this.$field[difference.x][difference.y];
            const oldState = difference.from;
            const newState = difference.to;
            // removes flags from oldState which are set in newState
            const removeMask = oldState & ~newState;
            // removes flags from newState which are already in oldState
            const addMask = newState & ~oldState;

            $element.removeClass(getFieldClasses(removeMask));
            $element.addClass(getFieldClasses(addMask));
        });
        this.field = newField;
    }
}

Battlefield.FIELD = {
    SHIP_START_RIGHT: 1 << 0,
    SHIP_MIDDLE_RIGHT: 1 << 1,
    SHIP_END_RIGHT: 1 << 2,
    SHIP_START_DOWN: 1 << 3,
    SHIP_MIDDLE_DOWN: 1 << 4,
    SHIP_END_DOWN: 1 << 5,
    HIT: 1 << 6,
    MISS: 1 << 7,
    SEA: 1 << 8,
    DESTROYED: 1 << 9,
};

Battlefield.FIELD_CLASS = {
    1: 'ship-start-right',
    2: 'ship-middle-right',
    4: 'ship-end-right',
    8: 'ship-start-down',
    16: 'ship-middle-down',
    32: 'ship-end-down',
    64: 'hit',
    128: 'miss',
    256: 'sea',
    512: 'destroyed',
};

function getFieldForShipAtOffset(ship, offset) {
    const start = ship.orientation === 'right' ? Battlefield.FIELD.SHIP_START_RIGHT : Battlefield.FIELD.SHIP_START_DOWN;
    if (offset === 0) {
        return start;
    } else if (offset === (ship.size - 1)) {
        return start << 2;
    }
    return start << 1;
}

function getFieldClasses(field) {
    return Object.keys(Battlefield.FIELD_CLASS).map(v => parseInt(v, 10)).filter(value => (field & value) === value).map(value => Battlefield.FIELD_CLASS[value])
        .join(' ');
}

module.exports = Battlefield;
