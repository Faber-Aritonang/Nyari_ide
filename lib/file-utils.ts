// lib/file-utils.ts — Baca file teks & ekstrak teks dari PDF (client-side)
// Penting: Batasi jumlah karakter agar tidak melebihi TPM limit Groq.

const MAX_CHARS = 8000; // ~2000 tokens (hemat untuk free tier Groq)

/**
 * Baca file teks (plain text, code, markdown, json, dll)
 * Mengembalikan content string yang sudah di-trim.
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 200 * 1024) {
      reject(new Error("File teks terlalu besar. Maksimal 200KB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let text = (reader.result as string) || "";
      // Strip null bytes & control characters
      text = text.replace(/\0/g, "");
      // Truncate jika terlalu panjang
      if (text.length > MAX_CHARS) {
        text =
          text.slice(0, MAX_CHARS) +
          "\n\n... [dipotong: file terlalu panjang, hanya " +
          MAX_CHARS +
          " karakter pertama yang dikirim]";
      }
      resolve(text);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsText(file);
  });
}

/**
 * Ekstrak teks dari PDF menggunakan pdf.js (client-side)
 * Hanya mengambil teks, tidak mengirim gambar/gambar dari PDF.
 * maxPages default 10 (untuk chat), atau "all" untuk RAG.
 */
export async function extractPdfText(
  file: File,
  maxPages?: number | "all"
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File PDF terlalu besar. Maksimal 10MB.");
  }

  // Dynamic import pdf.js agar tidak memblokir loading page
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  const totalPages = pdf.numPages;
  const limit = maxPages === "all" ? totalPages : Math.min(totalPages, maxPages ?? 10);

  for (let i = 1; i <= limit; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = (content.items as any[])
      .filter((item) => item.str)
      .map((item) => item.str)
      .join(" ");
    if (pageText.trim()) {
      textParts.push(`[Halaman ${i}]\n${pageText.trim()}`);
    }
  }

  let result = textParts.join("\n\n");

  if (totalPages > limit) {
    result += `\n\n... [hanya ${limit} dari ${totalPages} halaman yang diekstrak]`;
  }

  // Truncate hanya untuk mode chat (bukan RAG)
  if (maxPages !== "all" && result.length > MAX_CHARS) {
    result =
      result.slice(0, MAX_CHARS) +
      "\n\n... [dipotong: konten terlalu panjang, hanya " +
      MAX_CHARS +
      " karakter pertama yang dikirim]";
  }

  return result;
}
