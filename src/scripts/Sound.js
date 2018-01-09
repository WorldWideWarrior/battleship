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
    get volume() {
        return this.sound.volume;
    }
    set volume(volume) {
        this.sound.volume = volume;
    }
    get loop() {
        return this.sound.loop;
    }
    set loop(loop) {
        this.sound.loop = true;
    }
}
