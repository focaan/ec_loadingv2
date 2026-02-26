class FiveMLoadingScreen {
  constructor() {
    // Configuration
    this.config = {
      images: [
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/1.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/2.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/3.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/4.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/5.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/6.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/7.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/8.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/9.jpg",
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/images/10.jpg",
      ],
      music: [
        "https://cdn.eclipseroleplay.cz/loading/music2.mp3", // 0
        "https://cdn.eclipseroleplay.cz/loading/music3.mp3", // 1
        "https://cdn.eclipseroleplay.cz/loading/music4.mp3", // 2
        "https://raw.githubusercontent.com/Focaan/fcn_loading/main/fcn_loading/music/music.mp3"  // 3
      ],
      imageChangeInterval: 5000,
      musicChangeInterval: 280000,
    }

    // State
    this.currentImageIndex = 0
    this.currentMusicIndex = this.getRandomMusicIndex()
    this.volume = 30
    this.isMuted = false
    this.progress = 0
    this.isLoaded = false
    this.elements = {}
    this.audioEnabled = false
    this.audioAttempted = false
    this.manualNavigation = false
    this.audioContext = null
    this.lastManualIndex = 0

    // Initialize
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init())
    } else {
      this.init()
    }
  }

  getRandomMusicIndex() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.config.music.length);
    } while (newIndex === this.currentMusicIndex && this.config.music.length > 1);
    return newIndex;
  }

  init() {
    this.elements = {
      backgroundContainer: document.getElementById("backgroundContainer"),
      progressFill: document.getElementById("progressFill"),
      progressText: document.getElementById("progressText"),
      progressPercent: document.getElementById("progressPercent"),
      volumePercent: document.getElementById("volumePercent"),
      volumeFill: document.getElementById("volumeFill"),
      volumeIcon: document.getElementById("volumeIcon"),
      volumeBox: document.getElementById("volumeBox"),
      backgroundMusic: document.getElementById("backgroundMusic"),
      volumeUpControl: document.getElementById("volumeUpControl"),
      volumeDownControl: document.getElementById("volumeDownControl"),
      muteControl: document.getElementById("muteControl"),
    }

    
    this.audioEnabled = true
    this.playCurrentSong()

    if (!this.elements.backgroundContainer || !this.elements.backgroundMusic) {
      console.error("Critical elements missing!")
      return
    }

    this.loadBackgroundImages()
    this.loadMusic()
    this.setupEventListeners()
    this.startBackgroundRotation()
    this.startMusicRotation()
    this.updateVolumeDisplay()
    this.setupFiveMEvents()

    // Enable audio on any user interaction
    const enableAudio = () => {
      if (!this.audioEnabled) {
        this.audioEnabled = true
        if (this.audioAttempted) {
          this.playCurrentSong()
        }
        document.removeEventListener('click', enableAudio)
        document.removeEventListener('keydown', enableAudio)
        document.removeEventListener('touchstart', enableAudio)
      }
    }

    document.addEventListener('click', enableAudio)
    document.addEventListener('keydown', enableAudio)
    document.addEventListener('touchstart', enableAudio)
  }

  loadBackgroundImages() {
    if (!this.elements.backgroundContainer) return

    this.config.images.forEach((imageSrc, index) => {
      const imageDiv = document.createElement("div")
      imageDiv.className = `background-image ${index === 0 ? "active" : ""}`
      imageDiv.style.backgroundImage = `url('${imageSrc}')`
      this.elements.backgroundContainer.appendChild(imageDiv)
    })
  }

  loadMusic() {
    if (this.config.music.length > 0 && this.elements.backgroundMusic) {
      this.audioAttempted = true
      this.playCurrentSong()
    }
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      return true
    } catch (e) {
      console.error("AudioContext initialization failed:", e)
      return false
    }
  }

  async playCurrentSong() {
    if (!this.audioEnabled || !this.elements.backgroundMusic) return
    
    try {
      if (!this.audioContext) {
        const success = await this.initializeAudioContext()
        if (!success) return
      }

      const currentSong = this.config.music[this.currentMusicIndex]
      this.elements.backgroundMusic.src = currentSong
      this.elements.backgroundMusic.volume = this.volume / 100
      
      // Special FiveM handling - create new audio element each time
      const audioElement = new Audio(currentSong)
      audioElement.volume = this.volume / 100
      audioElement.loop = false
      
      // Replace the old audio element
      if (this.elements.backgroundMusic.parentNode) {
        this.elements.backgroundMusic.parentNode.replaceChild(audioElement, this.elements.backgroundMusic)
      }
      this.elements.backgroundMusic = audioElement
      
      // Add ended event listener
      audioElement.addEventListener('ended', () => this.handleSongEnded())
      
      // Attempt to play
      await audioElement.play().catch(e => {
        console.log("Audio play error (will retry after interaction):", e)
        this.audioEnabled = false
      })
    } catch (err) {
      console.log("Audio playback error:", err)
    }
  }

  handleSongEnded() {
    if (this.config.music.length > 1) {
      if (this.manualNavigation) {
        this.nextSongManual()
      } else {
        this.nextSongRandom()
      }
    }
  }

  nextSongManual() {
    this.manualNavigation = true
    this.lastManualIndex = this.currentMusicIndex
    this.currentMusicIndex = (this.currentMusicIndex + 1) % this.config.music.length
    this.playCurrentSong()
  }

  prevSongManual() {
    this.manualNavigation = true
    this.lastManualIndex = this.currentMusicIndex
    this.currentMusicIndex = (this.currentMusicIndex - 1 + this.config.music.length) % this.config.music.length
    this.playCurrentSong()
  }

  nextSongRandom() {
    this.manualNavigation = false
    this.currentMusicIndex = this.getRandomMusicIndex()
    this.playCurrentSong()
  }

  startMusicRotation() {
    setInterval(() => {
      if (this.config.music.length > 1 && !this.manualNavigation) {
        this.nextSongRandom()
      }
    }, this.config.musicChangeInterval)
  }

  startBackgroundRotation() {
    setInterval(() => {
      const images = document.querySelectorAll(".background-image");
      if (images.length <= 1) return;
      
      let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * images.length);
      } while (nextIndex === currentIndex && images.length > 1);
      
      images[currentIndex].classList.remove("active");
      images[nextIndex].classList.add("active");
      this.currentImageIndex = nextIndex;
    }, this.config.imageChangeInterval);
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "ArrowUp":
          this.changeVolume(5)
          this.highlightControl("up")
          break
        case "ArrowDown":
          this.changeVolume(-5)
          this.highlightControl("down")
          break
        case "Space":
          e.preventDefault()
          this.toggleMute()
          this.highlightControl("mute")
          break
        case "ArrowLeft":
          this.prevSongManual()
          break
        case "ArrowRight":
          this.nextSongManual()
          break
      }
    })

    // Special FiveM audio handler
    document.addEventListener('click', () => {
      if (!this.audioEnabled) {
        this.audioEnabled = true
        this.playCurrentSong()
      }
    }, { once: true })
  }

  setupFiveMEvents() {
    window.addEventListener("message", (event) => {
      const data = event.data
      if (data.eventName === "loadProgress") {
        this.updateProgress(data.loadFraction * 100, data.detail || "Načítání...")
      }
      if (data.eventName === "onLogLine") {
        this.updateProgressFromLog(data.message)
      }
    })
  }

  updateProgress(percentage, message) {
    this.progress = Math.min(100, Math.max(0, percentage))
    if (this.elements.progressFill) this.elements.progressFill.style.width = `${this.progress}%`
    if (this.elements.progressPercent) this.elements.progressPercent.textContent = `${Math.round(this.progress)}%`
    if (this.elements.progressText) this.elements.progressText.textContent = message
    
    if (this.progress >= 100 && !this.isLoaded) {
      this.isLoaded = true
      setTimeout(() => {
        if (this.elements.progressText) this.elements.progressText.textContent = "Načítání..."
      }, 500)
    }
  }

  updateProgressFromLog(logMessage) {
    const progressPatterns = [
      { pattern: /Downloading/, progress: 20, message: "Stahování zdrojů..." },
      { pattern: /Loading/, progress: 40, message: "Načítání..." },
      { pattern: /Initializing/, progress: 60, message: "Inicializace..." },
      { pattern: /Starting/, progress: 80, message: "Spouštění..." },
      { pattern: /Ready/, progress: 100, message: "Připraven!" },
    ]

    for (const pattern of progressPatterns) {
      if (pattern.pattern.test(logMessage)) {
        this.updateProgress(pattern.progress, pattern.message)
        break
      }
    }
  }

  changeVolume(delta) {
    this.volume = Math.max(0, Math.min(100, this.volume + delta))
    this.updateVolumeDisplay()
    if (this.elements.backgroundMusic) {
      this.elements.backgroundMusic.volume = this.volume / 100
    }
    this.highlightVolumeBox()
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    if (this.isMuted) {
      if (this.elements.backgroundMusic) this.elements.backgroundMusic.volume = 0
      if (this.elements.volumeBox) this.elements.volumeBox.classList.add("volume-muted")
    } else {
      if (this.elements.backgroundMusic) this.elements.backgroundMusic.volume = this.volume / 100
      if (this.elements.volumeBox) this.elements.volumeBox.classList.remove("volume-muted")
    }
    this.updateVolumeDisplay()
    this.highlightVolumeBox()
  }

  updateVolumeDisplay() {
    const displayVolume = this.isMuted ? 0 : this.volume
    if (this.elements.volumePercent) this.elements.volumePercent.textContent = `${displayVolume}%`
    if (this.elements.volumeFill) this.elements.volumeFill.style.width = `${displayVolume}%`

    if (this.elements.volumeIcon) {
      this.elements.volumeIcon.innerHTML = this.isMuted || displayVolume === 0 ? `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      ` : `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="m19.07 4.93-1.41 1.41A8.5 8.5 0 0 1 19.07 19.07l1.41 1.41A10.5 10.5 0 0 0 19.07 4.93z"/>
          <path d="m15.54 8.46-1.41 1.41A4.5 4.5 0 0 1 15.54 15.54l1.41 1.41A6.5 6.5 0 0 0 15.54 8.46z"/>
        </svg>
      `
    }
  }

  highlightControl(type) {
    const elements = {
      up: this.elements.volumeUpControl,
      down: this.elements.volumeDownControl,
      mute: this.elements.muteControl
    }
    if (elements[type]) {
      elements[type].classList.add("active")
      setTimeout(() => elements[type].classList.remove("active"), 200)
    }
  }

  highlightVolumeBox() {
    if (this.elements.volumeBox) {
      this.elements.volumeBox.classList.add("highlight")
      setTimeout(() => this.elements.volumeBox.classList.remove("highlight"), 300)
    }
  }
}

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new FiveMLoadingScreen())
} else {
  new FiveMLoadingScreen()

}
