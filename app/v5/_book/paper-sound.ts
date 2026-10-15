// Paper, synthesised: no audio files. A looping band of noise whose loudness
// follows how fast the page is being dragged (the rustle), and a short low burst
// when a page lands (the flop). Audio starts on the first press, as browsers require.

export class PaperSound {
  private context: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private rustle: { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
  muted = false;

  private ensure() {
    if (this.context) return this.context;
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return null;
    this.context = new Context();
    const length = this.context.sampleRate * 2;
    this.noise = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = this.noise.getChannelData(0);
    // Slightly brown noise reads as paper rather than static.
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.035 * (Math.random() * 2 - 1)) / 1.035;
      data[i] = last * 3.2 + (Math.random() * 2 - 1) * 0.25;
    }
    return this.context;
  }

  /** Call from a pointerdown: browsers only allow audio to start inside a gesture. */
  wake() {
    if (this.muted) return;
    const context = this.ensure();
    if (context?.state === "suspended") void context.resume();
  }

  startRustle() {
    if (this.muted) return;
    const context = this.ensure();
    if (!context || !this.noise || this.rustle) return;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1900;
    filter.Q.value = 0.6;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    this.rustle = { source, gain, filter };
  }

  /** `speed` in page widths per second. */
  setRustle(speed: number) {
    if (!this.rustle || !this.context) return;
    const level = Math.min(0.16, speed * 0.055);
    this.rustle.gain.gain.setTargetAtTime(level, this.context.currentTime, 0.04);
    this.rustle.filter.frequency.setTargetAtTime(1400 + Math.min(2600, speed * 900), this.context.currentTime, 0.06);
  }

  stopRustle() {
    if (!this.rustle || !this.context) return;
    const { source, gain } = this.rustle;
    gain.gain.setTargetAtTime(0, this.context.currentTime, 0.05);
    source.stop(this.context.currentTime + 0.3);
    this.rustle = null;
  }

  /** A whole page swishing over by itself (buttons, keys, riffles). */
  swish(delay = 0) {
    if (this.muted) return;
    const context = this.ensure();
    if (!context || !this.noise) return;
    const at = context.currentTime + delay;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.playbackRate.value = 0.9 + Math.random() * 0.25;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(900, at);
    filter.frequency.linearRampToValueAtTime(3200, at + 0.25);
    filter.frequency.linearRampToValueAtTime(1200, at + 0.55);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.11, at + 0.12);
    gain.gain.linearRampToValueAtTime(0.06, at + 0.4);
    gain.gain.linearRampToValueAtTime(0, at + 0.62);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(at, Math.random());
    source.stop(at + 0.7);
  }

  /** The soft flop of a page settling onto the stack. */
  land(delay = 0, weight = 1) {
    if (this.muted) return;
    const context = this.ensure();
    if (!context || !this.noise) return;
    const at = context.currentTime + delay;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520 * weight;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.22 * weight, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(at, Math.random());
    source.stop(at + 0.2);
  }

  dispose() {
    this.stopRustle();
    void this.context?.close();
    this.context = null;
  }
}
