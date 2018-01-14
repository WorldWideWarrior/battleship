export class Sound {
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
    constructor(filename, preload = true) {
        this.filename = filename;
        /**
         * @type {HTMLAudioElement | HTMLAudioElement}
         */
        this.sound = document.createElement('audio');
        this.sound.src = filename;
        if (preload) {
            this.preload();
        } else {
            this.sound.setAttribute('preload', 'none');
        }
        this.sound.setAttribute('controls', 'none');
        this.sound.style.display = 'none';
        document.body.appendChild(this.sound);
    }

    playFromStart() {
        this.sound.currentTime = 0;
        this.sound.play();
    }
    stop() {
        this.sound.pause();
    }

    preload() {
        this.sound.setAttribute('preload', 'auto');
    }
}
