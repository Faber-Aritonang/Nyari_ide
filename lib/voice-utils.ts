// lib/voice-utils.ts — Rekam audio dari mikrofon untuk Whisper

// Simpan reference agar bisa stop dari luar
let currentRecorder: MediaRecorder | null = null;
let currentStream: MediaStream | null = null;

/**
 * Mulai rekam audio dari mikrofon.
 * Mengembalikan fungsi stop() yang akan mengembalikan Blob audio.
 */
export function startRecording(): Promise<{
  stop: () => Promise<Blob>;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      reject(new Error("Browser tidak mendukung rekam audio."));
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        currentStream = stream;

        // Cari mimeType yang didukung browser
        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/ogg;codecs=opus",
        ];
        let selectedMime = "";
        for (const mime of mimeTypes) {
          if (MediaRecorder.isTypeSupported(mime)) {
            selectedMime = mime;
            break;
          }
        }

        const options = selectedMime ? { mimeType: selectedMime } : {};
        const mediaRecorder = new MediaRecorder(stream, options);
        currentRecorder = mediaRecorder;

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onerror = () => {
          stream.getTracks().forEach((track) => track.stop());
          currentRecorder = null;
          currentStream = null;
        };

        // Mulai rekam dengan timeslice 1 detik
        // (agar data tersedia setiap detik, tidak hanya saat stop)
        mediaRecorder.start(1000);

        resolve({
          stop: () =>
            new Promise<Blob>((res) => {
              mediaRecorder.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
                currentRecorder = null;
                currentStream = null;
                const mimeType = selectedMime || "audio/webm";
                const blob = new Blob(chunks, { type: mimeType });
                res(blob);
              };
              if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
              } else {
                // Sudah berhenti, langsung resolve
                const mimeType = selectedMime || "audio/webm";
                res(new Blob(chunks, { type: mimeType }));
              }
            }),
        });
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
 * Stop rekaman yang sedang berjalan (jika ada).
 */
export function stopCurrentRecording(): void {
  if (currentRecorder?.state === "recording") {
    currentRecorder.stop();
  }
  currentStream?.getTracks().forEach((track) => track.stop());
  currentRecorder = null;
  currentStream = null;
}

/**
 * Rekam audio dari mikrofon (auto-stop setelah maxDuration detik).
 * Mengembalikan Blob audio.
 */
export function recordAudio(
  maxDurationMs: number = 30000
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    startRecording()
      .then(({ stop }) => {
        // Auto-stop setelah maxDuration
        const timer = setTimeout(() => {
          stop().then(resolve).catch(reject);
        }, maxDurationMs);

        // Override stop untuk clear timer
        const originalStop = stop;
        const wrappedStop = async () => {
          clearTimeout(timer);
          return originalStop();
        };

        // Simpan wrapped stop agar bisa dipanggil dari luar
        currentStopFn = wrappedStop;
      })
      .catch(reject);
  });
}

// Simpan stop function global agar bisa diakses dari chat page
let currentStopFn: (() => Promise<Blob>) | null = null;

/**
 * Stop rekaman dan dapatkan hasilnya.
 */
export async function stopRecording(): Promise<Blob | null> {
  if (currentStopFn) {
    const blob = await currentStopFn();
    currentStopFn = null;
    return blob;
  }
  return null;
}
