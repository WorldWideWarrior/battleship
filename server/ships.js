const CARRIER = {
    name: "carrier",
    size: 5,
};

const BATTLESHIP = {
    name: "battleship",
    size: 4,
};

const CRUISER = {
    name: "cruiser",
    size: 3,
};

const DESTROYER = {
    name: "destroyer",
    size: 2,
};

function sizeOfShip(shipAsString) {
    if(shipAsString === CARRIER.name) {
        return CARRIER.size;
    } else if(shipAsString === BATTLESHIP.name) {
        return BATTLESHIP.size;
    } else if(shipAsString === CRUISER.name) {
        return CRUISER.size;
    } else if(shipAsString === DESTROYER.name) {
        return DESTROYER.size;
    }
}

/**
 *
 * @param x
 * @param y
 * @param ship {{size: number, position: {x: number, y: number}, orientation: string}}
 * @returns {boolean}
 */
function isPointOnShip(x, y, ship) {
    if(ship.orientation === "right") {
        return ship.position.y === y &&
            x >= ship.position.x && x < (ship.position.x + ship.size);
    } else {
        return ship.position.x === x &&
            y >= ship.position.y && y < (ship.position.y + ship.size);
    }
}

module.exports = {
    CARRIER,
    BATTLESHIP,
    CRUISER,
    DESTROYER,
    sizeOfShip: sizeOfShip,
    isPointOnShip: isPointOnShip,
};
