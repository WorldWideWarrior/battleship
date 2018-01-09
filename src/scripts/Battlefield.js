export class Battlefield {

    get width() {
        return 10;
    }
    get height() {
        return 10;
    }

    constructor(table) {
        this.table = table;
        this.generateField(table, this.width, this.height);
    }

    generateField(table, width, height) {
        for (let row = 0; row < height; row++) {
            const rowElement = $('<tr></tr>');
            for (let column = 0; column < width; column++) {
                const columnElement = $('<td/>');

                ((clickRow, clickColumn) => {
                    columnElement.on('click', () => {
                        this.onClickOnField(clickColumn, clickRow);
                    });
                })(row, column);

                rowElement.append(columnElement);
            }
            table.append(rowElement);
        }
    }

    onClickOnField(x, y) {
        console.debug(`Click: ${x}, ${y}`);
    }
}
