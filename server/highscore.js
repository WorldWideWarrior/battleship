/**
 * Saves COUNT_HIGHSCORES highscores in a json object
 */
const COUNT_HIGHSCORES = 5;
const HIGHSCORE_FILE = 'highscore';

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

        if(this.json.highscores.length < 5) {
            this.json.highscores.push({name: name, points: points});
            this.save();
        } else {

            let highestScoreIndex = 0;
            let highestScore = this.json.highscores[0];
            for (let i = 1; i < this.json.highscores.length; i++) {
                if (highestScore.points < this.json.highscores[i].points) {
                    highestScore = this.json.highscores[i];
                    highestScoreIndex = i;
                }
            }

            if (highestScore.points >= points) {
                //replace last entry
                this.json.highscores[highestScoreIndex].points = points;
                this.json.highscores[highestScoreIndex].name = name;

                this.save();
            }
        }
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