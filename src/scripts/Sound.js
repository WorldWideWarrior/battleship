export class Sound {

    constructor(filename) {
        this.filename = filename;
        /**
         * @type {HTMLAudioElement | HTMLAudioElement}
         */
        this.sound = document.createElement("audio");
        this.sound.src = filename;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);
    }

    playFromStart() {
        this.sound.play();
    }
    stop() {
        this.sound.pause();
    }
    setVolume(volume) {
        this.sound.volume = volume;
    }
}
