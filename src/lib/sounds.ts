const ctx = () =>
  new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)()

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.05,
) {
  const ac = ctx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()

  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume

  osc.connect(gain)
  gain.connect(ac.destination)

  osc.start()
  osc.stop(ac.currentTime + duration / 1000)

  return { ac, osc, gain }
}

export function playClick() {
  tone(800, 50, 'sine', 0.05)
}

export function playSuccess() {
  const ac = ctx()
  const now = ac.currentTime

  const osc1 = ac.createOscillator()
  const osc2 = ac.createOscillator()
  const gain = ac.createGain()

  osc1.type = 'sine'
  osc1.frequency.value = 523
  osc2.type = 'sine'
  osc2.frequency.value = 659

  gain.gain.value = 0.05

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ac.destination)

  osc1.start(now)
  osc1.stop(now + 0.1)

  osc2.start(now + 0.1)
  osc2.stop(now + 0.2)
}

export function playError() {
  const ac = ctx()
  const now = ac.currentTime

  const osc1 = ac.createOscillator()
  const osc2 = ac.createOscillator()
  const gain = ac.createGain()

  osc1.type = 'square'
  osc1.frequency.value = 400
  osc2.type = 'square'
  osc2.frequency.value = 300

  gain.gain.value = 0.05

  osc1.connect(gain)
  osc2.connect(gain)
  gain.connect(ac.destination)

  osc1.start(now)
  osc1.stop(now + 0.1)

  osc2.start(now + 0.1)
  osc2.stop(now + 0.2)
}
