export class Highscore {
    constructor(url) {
        this.url = url;
    }

    getHighscores(callback) {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                console.log(`Response highscore: ${xmlHttp.responseText}`);
                let jsonHighscore = JSON.parse(xmlHttp.responseText).highscores.sort(function(a, b) {
                    return b.points - a.points;
                });

                callback(jsonHighscore);
            }

        };
        xmlHttp.open("GET", this.url, true); // true for asynchronous
        xmlHttp.send(null);
    }

    setHighscore(name, points) {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                console.log(`Response highscore: ${xmlHttp.responseText}`);
                return true;
            } else if(xmlHttp.status === 403) {
                console.log(`Permission denied: ${xmlHttp.responseText}`);
                return false;
            }

        };
        xmlHttp.open("POST", this.url, true); // true for asynchronous
        xmlHttp.send(null);
    }
}