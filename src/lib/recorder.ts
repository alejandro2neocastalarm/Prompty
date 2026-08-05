/** Microphone recorder that produces a complete 16 kHz mono WAV blob. */
export type Recorder = {
  stop: () => Promise<string>;
};

function encodeWav(chunks: Float32Array[], sampleRate: number): ArrayBuffer {
  const target = 16000;
  const ratio = sampleRate / target;
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const source = new Float32Array(total);
  let o = 0;
  for (const c of chunks) {
    source.set(c, o);
    o += c.length;
  }
  const outLength = Math.floor(total / ratio);
  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + outLength * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, target, true);
  view.setUint32(28, target * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, outLength * 2, true);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, source[Math.floor(i * ratio)] ?? 0));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const node = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(node);
  node.connect(ctx.destination);

  return {
    stop: async () => {
      stream.getTracks().forEach((t) => t.stop());
      node.disconnect();
      source.disconnect();
      const wav = encodeWav(chunks, ctx.sampleRate);
      await ctx.close();
      if (wav.byteLength < 4000) throw new Error("EMPTY_AUDIO");
      return toBase64(wav);
    },
  };
}
