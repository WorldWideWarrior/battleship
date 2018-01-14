const Ships = require('./ships.js');

const COUNT_TRIES = 50;
const FIELD_SIZE = 10;
const DOWN = 1;

let shipsPlaced;
let fieldsNotToUse;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fieldsNotToUseContains(x, y) {
    if (x < 0 || y < 0) { return false; }

    return fieldsNotToUse[x][y] === 1;
}

function fieldsNotToUseAdd(x, y) {
    if (x >= 0 && y >= 0 && x < FIELD_SIZE && y < FIELD_SIZE) {
        fieldsNotToUse[x][y] = 1;
    }
}

function canPlaceShip(ship) {
    let shipPosition;

    if (ship.orientation === 'right') {
        // check borders
        if (ship.position.x + Ships.sizeOfShip(ship.name) > FIELD_SIZE) { return false; }

        // check collision with other ships
        for (shipPosition = ship.position.x; shipPosition < ship.position.x + Ships.sizeOfShip(ship.name); shipPosition++) {
            if (fieldsNotToUseContains(shipPosition, ship.position.y)) { return false; }
        }
    } else if (ship.orientation === 'down') {
        // check borders
        if (ship.position.y + Ships.sizeOfShip(ship.name) > FIELD_SIZE) { return false; }

        // check collision with other ships
        for (shipPosition = ship.position.y; shipPosition < ship.position.y + Ships.sizeOfShip(ship.name); shipPosition++) {
            if (fieldsNotToUseContains(ship.position.x, shipPosition)) { return false; }
        }
    }

    return true;
}

function tryToPlaceShip(shipToPlace) {
    // generate random coordiantes and orientation an try to add
    // the ship. Try COUNT_TRIES times and then return false
    let tries;
    for (tries = 0; tries < COUNT_TRIES; tries++) {
        let orientationString;
        const orientation = getRandomInt(0, 1); // 0 is right and 1 is down
        let xPosition;
        let yPosition;
        if (orientation === DOWN) {
            orientationString = 'down';
            xPosition = getRandomInt(0, FIELD_SIZE - 1);
            yPosition = getRandomInt(0, FIELD_SIZE - 1 - shipToPlace.size);
        } else {
            orientationString = 'right';
            xPosition = getRandomInt(0, FIELD_SIZE - 1 - shipToPlace.size);
            yPosition = getRandomInt(0, FIELD_SIZE - 1);
        }

        const newShip = {
            name: shipToPlace.name,
            position: {
                x: xPosition,
                y: yPosition,
            },
            orientation: orientationString,
            size: shipToPlace.size,
        };

        if (canPlaceShip(newShip)) {
            // update fields not to use
            const xStart = newShip.position.x - 1;
            let xEnd;
            const yStart = newShip.position.y - 1;
            let yEnd;
            if (orientation === DOWN) {
                xEnd = xStart + 2;
                yEnd = yStart + 1 + shipToPlace.size;
            } else {
                xEnd = xStart + 1 + shipToPlace.size;
                yEnd = yStart + 2;
            }

            for (let x = xStart; x <= xEnd; x++) {
                for (let y = yStart; y <= yEnd; y++) {
                    fieldsNotToUseAdd(x, y);
                }
            }

            shipsPlaced.push(newShip);
            return true;
        }
    }

    return false;
}

function tryToPlaceAllShips(shipsToPlace) {
    for (let shipIndex = 0; shipIndex < shipsToPlace.length; shipIndex++) {
        if (!tryToPlaceShip(shipsToPlace[shipIndex])) {
            return false;
        }
    }

    return true;
}

function generateShips(shipsToGenerate) {
    do {
        shipsPlaced = [];
        fieldsNotToUse = new Array(FIELD_SIZE);
        for (let i = 0; i < FIELD_SIZE; i++) {
            const array = new Array(FIELD_SIZE);
            for (let j = 0; j < FIELD_SIZE; j++) {
                array[j] = 0;
            }
            fieldsNotToUse[i] = array;
        }
    } while (!tryToPlaceAllShips(shipsToGenerate));

    return shipsPlaced;
}

module.exports = {
    generateShips,
};
