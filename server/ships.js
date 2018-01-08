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

module.exports = {
    CARRIER,
    BATTLESHIP,
    CRUISER,
    DESTROYER,
    sizeOfShip: sizeOfShip,
};