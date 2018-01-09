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
        this.hits = [];
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

    generateFieldState(ships, hits) {
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
                console.log(ship, x, y);
                field[x][y] = Battlefield.FIELD.SHIP;
            }
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
        const newField = this.generateFieldState(this.ships, this.hits);
        const differences = this.calculateDifferencesBetweenFields(this.field, newField);
        console.log(differences);
        differences.forEach((difference) => {
            console.log(difference);
            const $element = this.$field[difference.x][difference.y];
            $element.removeClass(Battlefield.FIELD_CLASS[difference.from]);
            $element.addClass(Battlefield.FIELD_CLASS[difference.to]);
        });
        this.field = newField;
    }

}

Battlefield.FIELD = {
    SEA: 0,
    SHIP: 1,
};

Battlefield.FIELD_CLASS = {
    0: "sea",
    1: "ship",
};
