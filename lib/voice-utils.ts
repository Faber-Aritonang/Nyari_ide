// lib/voice-utils.ts — Rekam audio dari mikrofon untuk Whisper

/**
 * Rekam audio dari mikrofon.
 * Mengembalikan Blob audio (webm/opus format).
 */
export function recordAudio(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      reject(new Error("Browser tidak mendukung rekam audio."));
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          // Stop semua track (matikan mikrofon)
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(chunks, { type: "audio/webm" });
          resolve(blob);
        };

        mediaRecorder.onerror = () => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("Gagal merekam audio."));
        };

        // Mulai rekam
        mediaRecorder.start();

        // Auto-stop setelah 30 detik (maks)
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, 30000);
      })
      .catch(() => {
        reject(
          new Error(
            "Akses mikrofon ditolak. Berikan izin mikrofon di browser."
          )
        );
      });
  });
}

/**
 * Convert Blob audio ke base64 data URL.
 */
export function audioToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal convert audio."));
    reader.readAsDataURL(blob);
  });
}
