// lib/i18n.ts — Toggle bahasa Indonesia & English
// Semua string UI terpusat di sini.

export type Lang = "id" | "en";

const strings = {
  id: {
    // App
    appName: "Nyari_ide",
    tagline: "Chat AI Multimodal — Gratis & Open Source",

    // Auth
    login: "Masuk",
    register: "Daftar",
    logout: "Logout",
    email: "Email",
    password: "Password",
    loginTitle: "Masuk ke akun Anda.",
    registerTitle: "Daftar akun — khusus email yang sudah diundang.",
    loginButton: "Masuk",
    registerButton: "Daftar",
    loginLoading: "Memproses...",
    registerLoading: "Mendaftarkan...",
    noAccount: "Belum punya akun?",
    hasAccount: "Sudah punya akun?",
    registerSuccess: "Pendaftaran berhasil! Silakan masuk.",
    registerError: "Email ini tidak terdaftar di whitelist. Hubungi admin.",
    passwordHint: "Password (min. 6 karakter, ada huruf besar & angka)",
    placeholders: {
      email: "nama@email.com",
      password: "••••••••",
    },

    // Chat
    newConversation: "Percakapan Baru",
    newConversationShort: "+ Baru",
    noConversations: "Belum ada percakapan.\nKlik tombol di atas untuk memulai.",
    selectOrCreate: "Pilih percakapan atau buat yang baru.",
    startChatting: "Kirim pesan untuk memulai chatting dengan Nyari_ide.",
    typeMessage: "Ketik pesan... (Enter untuk kirim, Shift+Enter baris baru)",
    typeImagePrompt: "Deskripsikan gambar yang ingin dibuat...",
    send: "Kirim",
    generate: "Generate",
    generating: "Generating...",
    loadingHistory: "Memuat riwayat...",
    deleteConfirm: "Hapus percakapan ini?",

    // Voice
    voiceInput: "Rekam suara (Whisper)",
    recording: "Merekam... klik untuk berhenti",
    voiceError: "Gagal merekam audio.",
    voiceAccessDenied: "Akses mikrofon ditolak. Berikan izin mikrofon di browser.",

    // TTS
    listen: "Dengarkan",
    stop: "Stop",
    ttsNotSupported: "Browser tidak mendukung text-to-speech.",

    // File upload
    uploadImage: "Upload gambar (JPG/PNG, maks 4MB)",
    uploadFile: "Upload file teks/PDF (maks 200KB teks, 5MB PDF)",
    imageGenMode: "Generate gambar dari teks (GPT Image 2 via Pollinations.ai)",
    imageCompressed: "Gambar akan di-compress otomatis ke JPEG",
    imageFormatError: "Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.",
    imageSizeError: "Ukuran gambar maksimal 4MB.",
    fileFormatError: "Format file tidak didukung. Gunakan file teks atau PDF.",
    fileTooLarge: "File terlalu besar.",
    downloadImage: "⬇ Download gambar",

    // Settings
    settings: "Pengaturan",
    customInstructions: "Instruksi Kustom",
    customInstructionsDesc: "Tentukan bagaimana AI harus merespons Anda. Instruksi ini akan ditambahkan ke setiap percakapan.",
    customInstructionsPlaceholder: "Contoh: Jawab selalu dalam bahasa Inggris. Gunakan gaya formal. Fokus pada topik teknologi.",
    save: "Simpan",
    saving: "Menyimpan...",
    saved: "Tersimpan!",
    maxChars: "Maks 2000 karakter",

    // Actions v1.1
    copyMessage: "Salin pesan",
    copied: "Tersalin!",
    editMessage: "Edit pesan",
    retryMessage: "Coba lagi",
    regenerate: "Generate ulang",
    exportChat: "Export chat",
    exportMd: "Download sebagai Markdown",
    copiedToClipboard: "Pesan tersalin ke clipboard!",

    // Errors
    networkError: "Terjadi kesalahan jaringan. Coba lagi.",
    rateLimit: "Kuota AI habis (rate limit). Tunggu beberapa saat.",
    voiceRateLimit: "Kuota voice input habis. Tunggu beberapa saat.",
    transcribeError: "Gagal mengubah suara ke teks. Coba lagi.",
  },
  en: {
    // App
    appName: "Nyari_ide",
    tagline: "Multimodal AI Chat — Free & Open Source",

    // Auth
    login: "Login",
    register: "Register",
    logout: "Logout",
    email: "Email",
    password: "Password",
    loginTitle: "Sign in to your account.",
    registerTitle: "Create account — invited emails only.",
    loginButton: "Sign In",
    registerButton: "Register",
    loginLoading: "Processing...",
    registerLoading: "Registering...",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    registerSuccess: "Registration successful! Please sign in.",
    registerError: "This email is not on the whitelist. Contact admin.",
    passwordHint: "Password (min. 6 chars, uppercase & number)",
    placeholders: {
      email: "name@email.com",
      password: "••••••••",
    },

    // Chat
    newConversation: "New Conversation",
    newConversationShort: "+ New",
    noConversations: "No conversations yet.\nClick the button above to start.",
    selectOrCreate: "Select a conversation or create a new one.",
    startChatting: "Send a message to start chatting with Nyari_ide.",
    typeMessage: "Type a message... (Enter to send, Shift+Enter for new line)",
    typeImagePrompt: "Describe the image you want to create...",
    send: "Send",
    generate: "Generate",
    generating: "Generating...",
    loadingHistory: "Loading history...",
    deleteConfirm: "Delete this conversation?",

    // Voice
    voiceInput: "Record voice (Whisper)",
    recording: "Recording... click to stop",
    voiceError: "Failed to record audio.",
    voiceAccessDenied: "Microphone access denied. Please allow microphone in browser.",

    // TTS
    listen: "Listen",
    stop: "Stop",
    ttsNotSupported: "Browser does not support text-to-speech.",

    // File upload
    uploadImage: "Upload image (JPG/PNG, max 4MB)",
    uploadFile: "Upload text/PDF file (max 200KB text, 5MB PDF)",
    imageGenMode: "Generate image from text (GPT Image 2 via Pollinations.ai)",
    imageCompressed: "Image will be auto-compressed to JPEG",
    imageFormatError: "Unsupported image format. Use JPG, PNG, or WebP.",
    imageSizeError: "Image size max 4MB.",
    fileFormatError: "Unsupported file format. Use text or PDF file.",
    fileTooLarge: "File too large.",
    downloadImage: "⬇ Download image",

    // Settings
    settings: "Settings",
    customInstructions: "Custom Instructions",
    customInstructionsDesc: "Define how the AI should respond to you. These instructions will be added to every conversation.",
    customInstructionsPlaceholder: "Example: Always respond in English. Use formal style. Focus on technology topics.",
    save: "Save",
    saving: "Saving...",
    saved: "Saved!",
    maxChars: "Max 2000 characters",

    // Actions v1.1
    copyMessage: "Copy message",
    copied: "Copied!",
    editMessage: "Edit message",
    retryMessage: "Retry",
    regenerate: "Regenerate",
    exportChat: "Export chat",
    exportMd: "Download as Markdown",
    copiedToClipboard: "Message copied to clipboard!",

    // Errors
    networkError: "Network error. Please try again.",
    rateLimit: "AI quota exceeded. Please wait a moment.",
    voiceRateLimit: "Voice quota exceeded. Please wait a moment.",
    transcribeError: "Failed to transcribe audio. Please try again.",
  },
} as const;

// State global bahasa
let currentLang: Lang = "id";

export function setLang(lang: Lang) {
  currentLang = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem("nyari_ide_lang", lang);
  }
}

export function getLang(): Lang {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("nyari_ide_lang") as Lang | null;
    if (saved === "id" || saved === "en") {
      currentLang = saved;
      return saved;
    }
  }
  return currentLang;
}

/**
 * Dapatkan string UI berdasarkan bahasa aktif.
 * Contoh: t("send") → "Kirim" (id) atau "Send" (en)
 */
export function t(key: keyof (typeof strings)["id"]): string {
  return strings[currentLang][key] as string;
}
