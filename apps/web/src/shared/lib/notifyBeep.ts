let audioCtx: AudioContext | null = null;

export function notifyBeep() {
    try {
        const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;
        audioCtx ??= new AudioContextCtor();
        const ctx = audioCtx;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = 880;
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        void ctx.resume();
    } catch {
        // Ignore autoplay / unsupported audio failures.
    }
}
