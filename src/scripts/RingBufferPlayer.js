export class RingBufferPlayer {
    constructor(sounds) {
        this.soundIndex = -1;
        /**
         * @type {[Sound]}
         */
        this.sounds = sounds;
        /**
         * @type {Sound}
         */
        this.previouslyPlayedSound = null;
    }
    playNext() {
        this.playAtIndex(this.soundIndex + 1);
    }
    playAtIndex(index) {
        index = index % this.sounds.length;

        if(this.previouslyPlayedSound) {
            this.previouslyPlayedSound.stop();
        }

        const sound = this.sounds[index];
        sound.playFromStart();
        this.previouslyPlayedSound = sound;
        this.soundIndex = index;
        this.preloadNextSound(index);
    }

    preloadNextSound(currentIndex) {
        const nextIndex = (currentIndex + 1) % this.sounds.length;
        const nextSound = this.sounds[nextIndex];
        nextSound.preload();
    }


}
