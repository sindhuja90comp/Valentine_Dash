// =========================
// AUDIO SYNTHESIS MODULE
// =========================

let audioCtx = null;
let soundOn = true;

export function beep(freq = 440, dur = 0.08, type = "sine", gain = 0.05) {
  if (!soundOn) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch (_) {}
}

export function clap() {
  if (!soundOn) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;

    // Master chain: filters -> compressor -> output
    const bp = audioCtx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1800, now);
    bp.Q.setValueAtTime(0.8, now);

    const hp = audioCtx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(700, now);

    const comp = audioCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-24, now);
    comp.knee.setValueAtTime(30, now);
    comp.ratio.setValueAtTime(12, now);
    comp.attack.setValueAtTime(0.003, now);
    comp.release.setValueAtTime(0.12, now);

    const out = audioCtx.createGain();
    out.gain.setValueAtTime(0.9, now);

    bp.connect(hp);
    hp.connect(comp);
    comp.connect(out);
    out.connect(audioCtx.destination);

    // Helper: one short burst of filtered noise
    function burst(t, dur, amp) {
      const sr = audioCtx.sampleRate;
      const len = Math.max(1, Math.floor(sr * dur));
      const buffer = audioCtx.createBuffer(1, len, sr);
      const data = buffer.getChannelData(0);

      // noisier front, slightly decaying tail
      for (let i = 0; i < len; i++) {
        const x = Math.random() * 2 - 1;
        const decay = 1 - i / len;
        data[i] = x * (0.9 * decay + 0.1);
      }

      const src = audioCtx.createBufferSource();
      src.buffer = buffer;

      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      src.connect(g);
      g.connect(bp);

      src.start(t);
      src.stop(t + dur + 0.01);
    }

    // Multi-hit clap
    burst(now + 0.0, 0.03, 0.85);
    burst(now + 0.018, 0.04, 0.7);
    burst(now + 0.038, 0.055, 0.55);
    burst(now + 0.075, 0.09, 0.18);
  } catch (_) {}
}

export function continuousClaps(duration = 0.6) {
  if (!soundOn) return;
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;

  // Victory fanfare with harmonies
  const melodyNotes = [
    { freq: 261.63, dur: 0.15 }, // C4
    { freq: 293.66, dur: 0.15 }, // D4
    { freq: 329.63, dur: 0.15 }, // E4
    { freq: 392.0, dur: 0.15 }, // G4
    { freq: 440.0, dur: 0.2 }, // A4
    { freq: 523.25, dur: 0.2 }, // C5
    { freq: 587.33, dur: 0.25 }, // D5
    { freq: 659.25, dur: 0.3 }, // E5
    { freq: 740.0, dur: 0.3 }, // F#5
    { freq: 659.25, dur: 0.25 }, // E5
    { freq: 587.33, dur: 0.2 }, // D5
    { freq: 523.25, dur: 0.2 }, // C5
    { freq: 440.0, dur: 0.15 }, // A4
    { freq: 392.0, dur: 0.15 }, // G4
    { freq: 329.63, dur: 0.15 }, // E4
    { freq: 293.66, dur: 0.15 }, // D4
    { freq: 261.63, dur: 0.2 }, // C4
  ];

  let melodyTime = now;

  for (let note of melodyNotes) {
    // Main melody
    const mainOsc = audioCtx.createOscillator();
    mainOsc.type = "sine";
    mainOsc.frequency.setValueAtTime(note.freq, melodyTime);

    const mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(0, melodyTime);
    mainGain.gain.exponentialRampToValueAtTime(0.35, melodyTime + 0.04);
    mainGain.gain.exponentialRampToValueAtTime(0.15, melodyTime + note.dur);

    mainOsc.connect(mainGain);
    mainGain.connect(audioCtx.destination);
    mainOsc.start(melodyTime);
    mainOsc.stop(melodyTime + note.dur);

    // Harmony (major third)
    const harmonyOsc = audioCtx.createOscillator();
    harmonyOsc.type = "sine";
    harmonyOsc.frequency.setValueAtTime(note.freq * 1.25, melodyTime);

    const harmonyGain = audioCtx.createGain();
    harmonyGain.gain.setValueAtTime(0, melodyTime);
    harmonyGain.gain.exponentialRampToValueAtTime(0.18, melodyTime + 0.04);
    harmonyGain.gain.exponentialRampToValueAtTime(0.08, melodyTime + note.dur);

    harmonyOsc.connect(harmonyGain);
    harmonyGain.connect(audioCtx.destination);
    harmonyOsc.start(melodyTime);
    harmonyOsc.stop(melodyTime + note.dur);

    // Bass (lower octave)
    if (note.dur > 0.15) {
      const bassOsc = audioCtx.createOscillator();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(note.freq * 0.5, melodyTime);

      const bassGain = audioCtx.createGain();
      bassGain.gain.setValueAtTime(0, melodyTime);
      bassGain.gain.exponentialRampToValueAtTime(0.15, melodyTime + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.05, melodyTime + note.dur);

      bassOsc.connect(bassGain);
      bassGain.connect(audioCtx.destination);
      bassOsc.start(melodyTime);
      bassOsc.stop(melodyTime + note.dur);
    }

    melodyTime += note.dur;
  }

  // Applause with crescendo
  const totalClaps = Math.floor(duration / 0.2);
  for (let i = 0; i < totalClaps; i++) {
    const time = now + (i * duration) / totalClaps;
    const clapIntensity = 0.3 + (i / totalClaps) * 0.4;

    try {
      // Clap body
      const clapOsc = audioCtx.createOscillator();
      clapOsc.type = "sine";
      clapOsc.frequency.setValueAtTime(280 + Math.random() * 120, time);
      clapOsc.frequency.exponentialRampToValueAtTime(110, time + 0.06);

      const clapGain = audioCtx.createGain();
      clapGain.gain.setValueAtTime(0, time);
      clapGain.gain.exponentialRampToValueAtTime(0.35 * clapIntensity, time + 0.002);
      clapGain.gain.exponentialRampToValueAtTime(0.08, time + 0.06);

      clapOsc.connect(clapGain);
      clapGain.connect(audioCtx.destination);
      clapOsc.start(time);
      clapOsc.stop(time + 0.08);

      // Noise attack
      const sr = audioCtx.sampleRate;
      const noiseBufLen = Math.floor(sr * 0.06);
      const noiseBuf = audioCtx.createBuffer(1, noiseBufLen, sr);
      const noiseData = noiseBuf.getChannelData(0);

      for (let j = 0; j < noiseBufLen; j++) {
        const envelope = Math.exp(-j / (noiseBufLen * 0.12));
        noiseData[j] = (Math.random() * 2 - 1) * envelope;
      }

      const noiseSrc = audioCtx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.3 * clapIntensity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.03, time + 0.06);

      noiseSrc.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noiseSrc.start(time);

      // Cheering tones
      const cheerFreqs = [523.25, 587.33, 659.25, 740.0];
      for (let c = 0; c < 3; c++) {
        const cheerOsc = audioCtx.createOscillator();
        cheerOsc.type = "sine";
        const freq = cheerFreqs[c % cheerFreqs.length];
        cheerOsc.frequency.setValueAtTime(freq, time + 0.05);
        cheerOsc.frequency.exponentialRampToValueAtTime(freq * 1.08, time + 0.1);

        const cheerGain = audioCtx.createGain();
        cheerGain.gain.setValueAtTime(0, time + 0.05);
        cheerGain.gain.exponentialRampToValueAtTime(0.18 * clapIntensity, time + 0.07);
        cheerGain.gain.exponentialRampToValueAtTime(0.1, time + 0.14);

        cheerOsc.connect(cheerGain);
        cheerGain.connect(audioCtx.destination);
        cheerOsc.start(time + 0.05);
        cheerOsc.stop(time + 0.14);
      }
    } catch (_) {}
  }
}

export function toggleSound() {
  soundOn = !soundOn;
  return soundOn;
}

export function isSoundEnabled() {
  return soundOn;
}

export function setSoundEnabled(enabled) {
  soundOn = enabled;
}
