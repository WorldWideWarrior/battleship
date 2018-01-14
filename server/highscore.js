/**
 * Saves COUNT_HIGHSCORES highscores in a json object
 */
const COUNT_HIGHSCORES = 5;
const HIGHSCORE_FILE = 'highscore.json';

class Highscore {
    constructor(fs) {
        this.fs = fs;
        this.loadHighscores();
    }

    getHighscores() {
        return this.json;
    }

    setHighscore(name, points) {
        console.log(`Save highscore: name: ${name}, points: ${points}`);

        this.json.highscores.push({name: name, points: points});
        //sort points from low to high
        this.json.highscores.sort((highscoreEntryA, highscoreEntryB) => highscoreEntryA.points - highscoreEntryB.points);
        this.json.highscores = this.json.highscores.slice(0, COUNT_HIGHSCORES);
        this.save();
    }

    loadHighscores() {
        if(!this.json) {
            if(!this.fs.existsSync(HIGHSCORE_FILE)) {
                this.json = {
                    highscores: []
                };
                this.save();
            } else {
                this.json = JSON.parse(this.fs.readFileSync(HIGHSCORE_FILE, 'utf8'));
            }
        }
    }

    save() {
        this.fs.writeFileSync(HIGHSCORE_FILE, JSON.stringify(this.json), 'utf8');
    }
}

module.exports = Highscore;
