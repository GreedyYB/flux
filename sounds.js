// Sound System
const SoundSystem = {
    // Sound settings
    enabled: true,
    
    // Sound assets
    sounds: {
        ion: null,       // Ion placement sound
        vector: null,    // Vector/node creation sound
        nexusWin: null   // End game sound
    },

    // Initialize the sound system
    init() {
        console.log('Initializing sound system...');
        try {
            // Create audio elements for sounds
            this.sounds.ion = new Audio('sounds/ion.mp3');
            this.sounds.vector = new Audio('sounds/vector.mp3');
            this.sounds.nexusWin = new Audio('sounds/nexus.mp3');
            
            console.log('Sound files loaded:', {
                ion: this.sounds.ion.src,
                vector: this.sounds.vector.src,
                nexusWin: this.sounds.nexusWin.src
            });
            
            // Load sound preference from localStorage if available
            const savedSoundPreference = localStorage.getItem('soundEnabled');
            if (savedSoundPreference !== null) {
                this.enabled = savedSoundPreference === 'true';
                const soundToggle = document.getElementById('sound-toggle');
                if (soundToggle) {
                    soundToggle.checked = this.enabled;
                    console.log('Sound preference loaded:', this.enabled);
                } else {
                    console.warn('Sound toggle element not found');
                }
            }

            // Set up sound toggle listener
            const soundToggle = document.getElementById('sound-toggle');
            if (soundToggle) {
                soundToggle.addEventListener('change', (e) => {
                    this.enabled = e.target.checked;
                    localStorage.setItem('soundEnabled', this.enabled);
                    console.log('Sound toggled:', this.enabled);
                    
                    // Test sound when enabling
                    if (this.enabled) {
                        this.playIonSound();
                    }
                });
            }

            // Preload sounds and add error handlers
            Object.entries(this.sounds).forEach(([name, sound]) => {
                if (sound) {
                    sound.addEventListener('error', (e) => {
                        console.error(`Error loading ${name} sound:`, e);
                    });
                    
                    sound.addEventListener('canplaythrough', () => {
                        console.log(`${name} sound loaded successfully`);
                    });
                    
                    sound.load();
                }
            });
            
            console.log('Sound system initialization complete');
        } catch (error) {
            console.error('Error initializing sound system:', error);
        }
    },

    // Play the ion sound
    playIonSound() {
        if (!this.enabled) {
            console.log('Sound disabled, not playing ion sound');
            return;
        }
        if (!this.sounds.ion) {
            console.warn('Ion sound not loaded');
            return;
        }
        
        try {
            // Clone and play the sound to allow overlapping
            const sound = this.sounds.ion.cloneNode();
            sound.volume = 0.5; // Set volume to 50%
            sound.play()
                .then(() => console.log('Playing ion sound'))
                .catch(err => console.warn('Error playing ion sound:', err));
        } catch (error) {
            console.error('Error in playIonSound:', error);
        }
    },

    // Play the vector sound
    playVectorSound() {
        if (!this.enabled) {
            console.log('Sound disabled, not playing vector sound');
            return;
        }
        if (!this.sounds.vector) {
            console.warn('Vector sound not loaded');
            return;
        }
        
        try {
            // Clone and play the sound to allow overlapping
            const sound = this.sounds.vector.cloneNode();
            sound.volume = 0.5; // Set volume to 50%
            sound.play()
                .then(() => console.log('Playing vector sound'))
                .catch(err => console.warn('Error playing vector sound:', err));
        } catch (error) {
            console.error('Error in playVectorSound:', error);
        }
    },

    // Play the end game sound
    playEndGameSound() {
        if (!this.enabled) {
            console.log('Sound disabled, not playing end game sound');
            return;
        }
        if (!this.sounds.nexusWin) {
            console.warn('End game sound not loaded');
            return;
        }
        
        try {
            // Clone and play the sound
            const sound = this.sounds.nexusWin.cloneNode();
            sound.volume = 0.6; // Set volume to 60% for emphasis
            sound.play()
                .then(() => console.log('Playing end game sound'))
                .catch(err => console.warn('Error playing end game sound:', err));
        } catch (error) {
            console.error('Error in playEndGameSound:', error);
        }
    }
};

// Export the sound system
window.SoundSystem = SoundSystem;

// Initialize sound system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing sound system');
    if (window.SoundSystem) {
        window.SoundSystem.init();
    } else {
        console.error('Sound system not available');
    }
});
