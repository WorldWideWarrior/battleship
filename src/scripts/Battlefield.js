export class Battlefield {

    get width() {
        return 10;
    }
    get height() {
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
        this.field = this.generateEmptyField();

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
        //initialize $field
        const $field = new Array(this.width);
        for(let x = 0; x < this.width; x++) {
            $field[x] = new Array(this.height);
        }

        for (let row = 0; row < this.height; row++) {
            const rowElement = $('<tr></tr>');
            for (let column = 0; column < this.width; column++) {
                const columnElement = $('<td/>');
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

    generateEmptyField() {
        let field = new Array(this.width);
        for(let x = 0; x < this.width; x++) {
            field[x] = new Array(this.height);
            for(let y = 0; y < this.height; y++) {
                field[x][y] = Battlefield.FIELD.SEA;
            }
        }
        return field;
    }

    onClickOnField(x, y) {
        console.debug(`Click: ${x}, ${y}`);
    }

    generateFieldState(ships, shots) {
        let field = this.generateEmptyField();

        ships.forEach((ship) => {
            for(let offset = 0; offset < ship.size; offset++) {
                let x = ship.position.x;
                let y = ship.position.y;
                if(ship.orientation === "down") {
                    y += offset;

                } else if(ship.orientation === "right") {
                    x += offset;
                } else {
                    console.error(`unknown orientation ${ship.orientation} for ship ${ship.name}`);
                    break;
                }
                field[x][y] = getFieldForShipAtOffset(ship, offset);
            }
        });

        shots.forEach((shot) => {
            field[shot.position.x][shot.position.y] &= ~Battlefield.FIELD.SEA; //remove sea flag
            field[shot.position.x][shot.position.y] |= shot.hit ? Battlefield.FIELD.HIT : Battlefield.FIELD.MISS;
        });
        return field;
    }

    calculateDifferencesBetweenFields(fromField, toField) {
        let differences = [];
        for(let x = 0; x < this.width; x++) {
            for(let y = 0; y < this.height; y++) {
                if(fromField[x][y] !== toField[x][y]) {
                    differences.push({
                        x: x,
                        y: y,
                        from: fromField[x][y],
                        to: toField[x][y],
                    })
                }
            }
        }
        return differences;
    }

    updateField() {
        const newField = this.generateFieldState(this.ships, this.shots);
        const differences = this.calculateDifferencesBetweenFields(this.field, newField);
        differences.forEach((difference) => {
            const $element = this.$field[difference.x][difference.y];
            const oldState = difference.from;
            const newState = difference.to;
            const removeMask = oldState & ~newState;
            const addMask = ~oldState & newState;

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
};

function getFieldForShipAtOffset(ship, offset) {
    const start = ship.orientation === "right" ? Battlefield.FIELD.SHIP_START_RIGHT : Battlefield.FIELD.SHIP_START_DOWN;
    if(offset === 0) {
        return start;
    } else if (offset === (ship.size - 1)) {
        return start << 2;
    } else {
        return start << 1;
    }
}

function getFieldClasses(field) {
    return Object.keys(Battlefield.FIELD_CLASS).map((v) => parseInt(v, 10)).filter((value) => {
        return (field & value) === value;
    }).map((value) => Battlefield.FIELD_CLASS[value]).join(" ");
}

const DEACTIVATED_CLASS = "deactivated-field";
const ACTIVATED_CLASS = "activated-field"

Battlefield.FIELD_CLASS = {
    1: "ship-start-right",
    2: "ship-middle-right",
    4: "ship-end-right",
    8: "ship-start-down",
    16: "ship-middle-down",
    32: "ship-end-down",
    64: "hit",
    128: "miss",
    256: "sea",
};


