const fs = require('fs');
/**
 * Saves COUNT_HIGHSCORES highscores in a json object
 */
const COUNT_HIGHSCORES = 5;
const HIGHSCORE_FILE = 'highscore.json';

class Highscore {
    constructor() {
        this.loadHighscores();
    }

    getHighscores() {
        return this.json;
    }

    addHighscore(name, points) {
        console.log(`Save highscore: name: ${name}, points: ${points}`);

        this.json.highscores.push({ name, points });
        // sort points from low to high
        this.json.highscores.sort((highscoreEntryA, highscoreEntryB) => highscoreEntryA.points - highscoreEntryB.points);
        this.json.highscores = this.json.highscores.slice(0, COUNT_HIGHSCORES);
        this.save();
    }

    loadHighscores() {
        if (!this.json) {
            if (!fs.existsSync(HIGHSCORE_FILE)) {
                this.json = {
                    highscores: [],
                };
                this.save();
            } else {
                this.json = JSON.parse(fs.readFileSync(HIGHSCORE_FILE, 'utf8'));
            }
        }
    }

    save() {
        fs.writeFileSync(HIGHSCORE_FILE, JSON.stringify(this.json), 'utf8');
    }
}

module.exports = new Highscore();
