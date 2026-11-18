export function playCompletionSound() {
  if (typeof AudioContext === 'undefined') return
  try {
    const audio = new AudioContext()
    const start = audio.currentTime
    const notes = [523.25, 659.25]
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator()
      const volume = audio.createGain()
      const when = start + index * 0.09
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      volume.gain.setValueAtTime(0.001, when)
      volume.gain.exponentialRampToValueAtTime(0.065, when + 0.035)
      volume.gain.exponentialRampToValueAtTime(0.001, when + 0.31)
      oscillator.connect(volume).connect(audio.destination)
      oscillator.start(when)
      oscillator.stop(when + 0.32)
      if (index === notes.length - 1) oscillator.onended = () => { void audio.close().catch(() => {}) }
    })
    void audio.resume().catch(() => audio.close().catch(() => {}))
  } catch {
    // Sound is optional and may be unavailable on this device.
  }
}
