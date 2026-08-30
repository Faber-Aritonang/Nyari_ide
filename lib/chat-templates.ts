// lib/chat-templates.ts — Pre-defined chat templates with diverse prompting techniques
// Techniques: Persona, Chain-of-Thought, Few-Shot, Structured, Iterative, Constraint-Based

export interface ChatTemplate {
  id: string;
  title: { id: string; en: string };
  description: { id: string; en: string };
  icon: string;
  technique: "persona" | "chain-of-thought" | "few-shot" | "structured" | "iterative" | "constraint" | "short";
  techniqueLabel: { id: string; en: string };
  initialMessage: { id: string; en: string };
  examples: { id: string; en: string }[];
  category: "coding" | "writing" | "brainstorm" | "analysis" | "general";
}

export const CHAT_TEMPLATES: ChatTemplate[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. PERSONA PROMPTS — Definisikan peran/spesialis AI
  // ═══════════════════════════════════════════════════════════════
  {
    id: "persona-senior-dev",
    title: { id: "👨‍💻 Senior Developer", en: "👨‍💻 Senior Developer" },
    description: { id: "AI berperan sebagai senior developer berpengalaman 10+ tahun", en: "AI acts as a senior developer with 10+ years of experience" },
    icon: "👨‍💻",
    technique: "persona",
    techniqueLabel: { id: "🎭 Persona Prompt", en: "🎭 Persona Prompt" },
    initialMessage: {
      id: `Kamu adalah seorang Senior Software Engineer dengan pengalaman 10+ tahun di bidang full-stack development. Kamu ahli dalam:
- System design & architecture
- Code review & best practices
- Debugging & performance optimization
- Mentoring junior developers

Gaya bicaramu:
- Jelaskan dengan contoh kode yang konkret
- Sebutkan trade-off dan alternatif solusi
- Berikan best practices berdasarkan pengalaman nyata
- Gunakan bahasa teknis yang tepat tapi tetap mudah dipahami

Tolong bantu saya dengan:`,
      en: `You are a Senior Software Engineer with 10+ years of experience in full-stack development. You are an expert in:
- System design & architecture
- Code review & best practices
- Debugging & performance optimization
- Mentoring junior developers

Your communication style:
- Explain with concrete code examples
- Mention trade-offs and alternative solutions
- Share best practices based on real experience
- Use precise technical terms that are still easy to understand

Please help me with:`
    },
    examples: [
      {
        id: "Review code React saya dan berikan saran untuk improve performance",
        en: "Review my React code and give suggestions to improve performance"
      },
      {
        id: "Bantu saya design system untuk aplikasi e-commerce yang scalable",
        en: "Help me design a scalable system for an e-commerce application"
      },
      {
        id: "Apa best practices untuk error handling di Node.js production?",
        en: "What are best practices for error handling in Node.js production?"
      },
      {
        id: "Jelaskan perbedaan microservices vs monolith untuk startup",
        en: "Explain the difference between microservices vs monolith for startups"
      },
    ],
    category: "coding",
  },
  {
    id: "persona-ux-designer",
    title: { id: "🎨 UX Design Expert", en: "🎨 UX Design Expert" },
    description: { id: "AI berperan sebagai UX designer profesional", en: "AI acts as a professional UX designer" },
    icon: "🎨",
    technique: "persona",
    techniqueLabel: { id: "🎭 Persona Prompt", en: "🎭 Persona Prompt" },
    initialMessage: {
      id: `Kamu adalah seorang UX Designer profesional dengan pengalaman 8 tahun di perusahaan teknologi besar (Google, Airbnb, Tokopedia).

Keahlianmu:
- User research & persona development
- Wireframing & prototyping
- Usability testing
- Design system & component library
- Accessibility (WCAG 2.1)

Kamu selalu memulai dengan memahami user needs, bukan langsung ke solusi visual.

Tolong bantu saya dengan:`,
      en: `You are a professional UX Designer with 8 years of experience at major tech companies (Google, Airbnb, Tokopedia).

Your expertise:
- User research & persona development
- Wireframing & prototyping
- Usability testing
- Design system & component library
- Accessibility (WCAG 2.1)

You always start by understanding user needs, not jumping to visual solutions.

Please help me with:`
    },
    examples: [
      {
        id: "Audit UX untuk aplikasi food delivery saya",
        en: "UX audit for my food delivery application"
      },
      {
        id: "Buat user persona untuk target market Gen Z",
        en: "Create user personas for Gen Z target market"
      },
      {
        id: "Bagaimana cara improve onboarding flow yang compleks?",
        en: "How to improve a complex onboarding flow?"
      },
      {
        id: "Design system apa yang cocok untuk startup fase awal?",
        en: "What design system suits an early-stage startup?"
      },
    ],
    category: "brainstorm",
  },
  {
    id: "persona-business-mentor",
    title: { id: "💼 Business Mentor", en: "💼 Business Mentor" },
    description: { id: "AI berperan sebagai mentor bisnis & startup", en: "AI acts as a business & startup mentor" },
    icon: "💼",
    technique: "persona",
    techniqueLabel: { id: "🎭 Persona Prompt", en: "🎭 Persona Prompt" },
    initialMessage: {
      id: `Kamu adalah seorang Business Mentor yang telah membantu 50+ startup dari ide hingga Series A. Pengalamanmu di bidang:
- Validasi ide bisnis
- Business model canvas
- Go-to-market strategy
- Fundraising & pitch deck
- Growth hacking

Gaya coaching-mu:
- Tanyakan pertanyaan pemantik sebelum memberi saran
- Bantu user menemukan jawaban sendiri
- Berikan framework yang terbukti efektif
- Realistis, bukan overly optimistic

Mari kita mulai:`,
      en: `You are a Business Mentor who has helped 50+ startups from idea to Series A. Your experience includes:
- Business idea validation
- Business model canvas
- Go-to-market strategy
- Fundraising & pitch deck
- Growth hacking

Your coaching style:
- Ask thought-provoking questions before giving advice
- Help users find their own answers
- Share proven frameworks
- Be realistic, not overly optimistic

Let's start:`
    },
    examples: [
      {
        id: "Saya punya ide startup edtech. Bagaimana cara validasi ide ini?",
        en: "I have an edtech startup idea. How to validate this idea?"
      },
      {
        id: "Bantu saya buat business model canvas untuk marketplace UMKM",
        en: "Help me create a business model canvas for an SME marketplace"
      },
      {
        id: "Saya ingin pitch ke investor. Bagaimana cara membuat pitch deck yang compelling?",
        en: "I want to pitch to investors. How to create a compelling pitch deck?"
      },
      {
        id: "Strategi apa yang cocok untuk acquire 1000 user pertama?",
        en: "What strategy is suitable to acquire the first 1000 users?"
      },
    ],
    category: "analysis",
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. CHAIN-OF-THOUGHT — Berpikir step-by-step
  // ═══════════════════════════════════════════════════════════════
  {
    id: "cot-problem-solver",
    title: { id: "🧩 Problem Solver (Step-by-Step)", en: "🧩 Problem Solver (Step-by-Step)" },
    description: { id: "AI berpikir step-by-step untuk menyelesaikan masalah kompleks", en: "AI thinks step-by-step to solve complex problems" },
    icon: "🧩",
    technique: "chain-of-thought",
    techniqueLabel: { id: "🔗 Chain-of-Thought", en: "🔗 Chain-of-Thought" },
    initialMessage: {
      id: `Saya butuh bantuan menyelesaikan masalah. Tolong gunakan pendekatan Chain-of-Thought:

Langkah 1: Pahami masalah dengan jelas
Langkah 2: Identifikasi informasi yang diketahui dan yang kurang
Langkah 3: Pecah masalah menjadi sub-masalah yang lebih kecil
Langkah 4: Selesaikan setiap sub-masalah secara bertahap
Langkah 5: Konsolidasi solusi dan verifikasi hasil

Masalah saya:`,
      en: `I need help solving a problem. Please use a Chain-of-Thought approach:

Step 1: Clearly understand the problem
Step 2: Identify known information and gaps
Step 3: Break down the problem into smaller sub-problems
Step 4: Solve each sub-problem step by step
Step 5: Consolidate solutions and verify results

My problem:`
    },
    examples: [
      {
        id: "Bagaimana cara migrate database dari MySQL ke PostgreSQL tanpa downtime?",
        en: "How to migrate a database from MySQL to PostgreSQL without downtime?"
      },
      {
        id: "Saya ingin buat algoritma rekomendasi produk. Bagaimana pendekatannya?",
        en: "I want to create a product recommendation algorithm. What's the approach?"
      },
      {
        id: "Aplikasi saya lambat. Bagaimana cara identifikasi dan fix performance bottleneck?",
        en: "My application is slow. How to identify and fix performance bottlenecks?"
      },
      {
        id: "Saya ingin scale aplikasi dari 100 ke 100.000 user. Apa yang perlu diubah?",
        en: "I want to scale an application from 100 to 100,000 users. What needs to change?"
      },
    ],
    category: "coding",
  },
  {
    id: "cot-decision-making",
    title: { id: "⚖️ Decision Making", en: "⚖️ Decision Making" },
    description: { id: "Analisis pro-kontra untuk pengambilan keputusan", en: "Analyze pros-cons for decision making" },
    icon: "⚖️",
    technique: "chain-of-thought",
    techniqueLabel: { id: "🔗 Chain-of-Thought", en: "🔗 Chain-of-Thought" },
    initialMessage: {
      id: `Saya perlu mengambil keputusan penting. Tolong bantu dengan analisis berikut:

1. Identifikasi semua opsi yang tersedia
2. Buat tabel pro-kontra untuk setiap opsi
3. Analisis risiko masing-masing opsi
4. Berikan rekomendasi dengan理由 yang jelas
5. Suggest langkah implementasi untuk opsi terbaik

Keputusan yang perlu saya ambil:`,
      en: `I need to make an important decision. Please help with the following analysis:

1. Identify all available options
2. Create a pros-cons table for each option
3. Analyze risks of each option
4. Provide a clear recommendation with reasons
5. Suggest implementation steps for the best option

The decision I need to make:`
    },
    examples: [
      {
        id: "Pilih teknologi frontend: React vs Vue vs Svelte untuk startup?",
        en: "Choose frontend technology: React vs Vue vs Svelte for a startup?"
      },
      {
        id: "Deploy di Vercel vs AWS vs GCP untuk aplikasi dengan budget terbatas?",
        en: "Deploy on Vercel vs AWS vs GCP for an app with limited budget?"
      },
      {
        id: "Build in-house vs outsource development untuk MVP?",
        en: "Build in-house vs outsource development for an MVP?"
      },
      {
        id: "Fokus ke satu fitur saja atau buat banyak fitur sekaligus?",
        en: "Focus on one feature or build multiple features at once?"
      },
    ],
    category: "analysis",
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. FEW-SHOT — Berikan contoh untuk diikuti
  // ═══════════════════════════════════════════════════════════════
  {
    id: "few-shot-code",
    title: { id: "📝 Code Generation (Few-Shot)", en: "📝 Code Generation (Few-Shot)" },
    description: { id: "AI mengikuti pola kode dari contoh yang diberikan", en: "AI follows code patterns from given examples" },
    icon: "📝",
    technique: "few-shot",
    techniqueLabel: { id: "🎯 Few-Shot Prompt", en: "🎯 Few-Shot Prompt" },
    initialMessage: {
      id: `Saya akan memberikan beberapa contoh kode. Tolong buat kode baru dengan pola yang sama:

=== CONTOH 1 ===
Input: Buat fungsi untuk validate email
Output:
\`\`\`typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
\`\`\`

=== CONTOH 2 ===
Input: Buat fungsi untuk validate phone number
Output:
\`\`\`typescript
function validatePhone(phone: string): boolean {
  const regex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return regex.test(phone.replace(/[\s-]/g, ''));
}
\`\`\`

Sekarang, buatkan kode dengan pola yang sama untuk:`,
      en: `I will provide some code examples. Please create new code following the same pattern:

=== EXAMPLE 1 ===
Input: Create a function to validate email
Output:
\`\`\`typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
\`\`\`

=== EXAMPLE 2 ===
Input: Create a function to validate phone number
Output:
\`\`\`typescript
function validatePhone(phone: string): boolean {
  const regex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return regex.test(phone.replace(/[\s-]/g, ''));
}
\`\`\`

Now, create code with the same pattern for:`
    },
    examples: [
      {
        id: "Buat fungsi validate URL dengan error handling yang konsisten",
        en: "Create a validate URL function with consistent error handling"
      },
      {
        id: "Buat fungsi formatCurrency dengan support multi-mata uang",
        en: "Create a formatCurrency function with multi-currency support"
      },
      {
        id: "Buat fungsi debounce dengan TypeScript generics",
        en: "Create a debounce function with TypeScript generics"
      },
      {
        id: "Buat fungsi retry dengan exponential backoff",
        en: "Create a retry function with exponential backoff"
      },
    ],
    category: "coding",
  },
  {
    id: "few-shot-email",
    title: { id: "📧 Email Writing (Few-Shot)", en: "📧 Email Writing (Few-Shot)" },
    description: { id: "AI menulis email mengikuti gaya dari contoh", en: "AI writes emails following the style from examples" },
    icon: "📧",
    technique: "few-shot",
    techniqueLabel: { id: "🎯 Few-Shot Prompt", en: "🎯 Few-Shot Prompt" },
    initialMessage: {
      id: `Saya akan berikan contoh email yang saya suka gayanya. Tolong tulis email baru dengan gaya yang sama:

=== CONTOH EMAIL ===
Subject: Proposal Kerja Sama - [Nama Perusahaan]

Halo [Nama],

Semoga email ini baik. Saya [Nama], [Jabatan] dari [Perusahaan].

Saya tertarik untuk menjajaki kerja sama di bidang [bidang]. Berdasarkan profil [Perusahaan], saya yakin kita bisa saling menguntungkan.

Beberapa poin yang bisa kita diskusikan:
1. [Poin 1]
2. [Poin 2]
3. [Poin 3]

Apakah ada waktu minggu ini untuk diskusi lebih lanjut?

Terima kasih,
[Nama]

=== TUGAS ===
Tulis email dengan gaya yang sama untuk:`,
      en: `I will give you an example email that I like the style of. Please write a new email with the same style:

=== EMAIL EXAMPLE ===
Subject: Collaboration Proposal - [Company Name]

Hi [Name],

I hope this email finds you well. I'm [Name], [Position] from [Company].

I'm interested in exploring a collaboration in [field]. Based on [Company]'s profile, I believe we can create mutual value.

Some points we could discuss:
1. [Point 1]
2. [Point 2]
3. [Point 3]

Would you have time this week for a further discussion?

Best regards,
[Name]

=== TASK ===
Write an email with the same style for:`
    },
    examples: [
      {
        id: "Follow-up email setelah meeting dengan calon client",
        en: "Follow-up email after a meeting with a potential client"
      },
      {
        id: "Email penawaran jasa konsultasi ke perusahaan teknologi",
        en: "Email offering consulting services to a tech company"
      },
      {
        id: "Email permintaan feedback dari user setelah beta testing",
        en: "Email requesting feedback from users after beta testing"
      },
      {
        id: "Email undangan webinar untuk komunitas developer",
        en: "Email invitation to a webinar for the developer community"
      },
    ],
    category: "writing",
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. STRUCTURED — Format terstruktur dengan section jelas
  // ═══════════════════════════════════════════════════════════════
  {
    id: "structured-api-doc",
    title: { id: "📋 API Documentation", en: "📋 API Documentation" },
    description: { id: "Buat dokumentasi API dengan format terstruktur", en: "Create API documentation with structured format" },
    icon: "📋",
    technique: "structured",
    techniqueLabel: { id: "📐 Structured Prompt", en: "📐 Structured Prompt" },
    initialMessage: {
      id: `Buat dokumentasi API dengan format terstruktur berikut:

## CONTEXT
[Untuk proyek apa API ini]

## ENDPOINTS
Untuk setiap endpoint, berikan:
- Method & URL
- Description
- Request body (JSON schema)
- Response (JSON schema)
- Error codes
- Example request & response

## AUTHENTICATION
[Penjelasan autentikasi]

## RATE LIMITING
[Batasan request]

Tolong buat dokumentasi untuk API:`,
      en: `Create API documentation with the following structured format:

## CONTEXT
[What project is this API for]

## ENDPOINTS
For each endpoint, provide:
- Method & URL
- Description
- Request body (JSON schema)
- Response (JSON schema)
- Error codes
- Example request & response

## AUTHENTICATION
[Authentication explanation]

## RATE LIMITING
[Request limits]

Please create documentation for the following API:`
    },
    examples: [
      {
        id: "API untuk sistem booking ruangan kantor",
        en: "API for an office room booking system"
      },
      {
        id: "REST API untuk e-commerce product management",
        en: "REST API for e-commerce product management"
      },
      {
        id: "Webhook API untuk payment gateway integration",
        en: "Webhook API for payment gateway integration"
      },
      {
        id: "API untuk sistem absensi karyawan mobile",
        en: "API for a mobile employee attendance system"
      },
    ],
    category: "coding",
  },
  {
    id: "structured-blog-post",
    title: { id: "📰 Blog Post Writer", en: "📰 Blog Post Writer" },
    description: { id: "Tulis artikel blog dengan struktur yang konsisten", en: "Write blog articles with consistent structure" },
    icon: "📰",
    technique: "structured",
    techniqueLabel: { id: "📐 Structured Prompt", en: "📐 Structured Prompt" },
    initialMessage: {
      id: `Tulis artikel blog dengan struktur berikut:

## META INFO
- Judul: [Judul yang menarik & SEO-friendly]
- Target Reader: [Siapa pembacanya]
- Tone: [Profesional/Casual/Educational]

## OUTLINE
1. Hook opening (pertanyaan atau statistik menarik)
2. Problem statement
3. Solusi (3-5 poin utama)
4. Contoh kasus / studi
5. Action items
6. Closing dengan CTA

## REQUIREMENTS
- Panjang: 800-1200 kata
- Gunakan heading & subheading
- Sertakan bullet points
- Tone: [Tone yang dipilih]

Topik artikel:`,
      en: `Write a blog article with the following structure:

## META INFO
- Title: [Attractive & SEO-friendly title]
- Target Reader: [Who is the audience]
- Tone: [Professional/Casual/Educational]

## OUTLINE
1. Hook opening (interesting question or statistic)
2. Problem statement
3. Solution (3-5 key points)
4. Case study / examples
5. Action items
6. Closing with CTA

## REQUIREMENTS
- Length: 800-1200 words
- Use headings & subheadings
- Include bullet points
- Tone: [Selected tone]

Article topic:`
    },
    examples: [
      {
        id: "Tips produktivitas untuk developer remote",
        en: "Productivity tips for remote developers"
      },
      {
        id: "Panduan lengkap memulai karir sebagai Full-Stack Developer",
        en: "Complete guide to starting a career as a Full-Stack Developer"
      },
      {
        id: "Kenapa startup harus invest di UX sejak awal",
        en: "Why startups should invest in UX from the start"
      },
      {
        id: "Tren teknologi 2026 yang wajib diketahui developer",
        en: "2026 technology trends developers must know"
      },
    ],
    category: "writing",
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. ITERATIVE — Bangun secara bertahap
  // ═══════════════════════════════════════════════════════════════
  {
    id: "iterative-app-builder",
    title: { id: "🏗️ App Builder (Iterative)", en: "🏗️ App Builder (Iterative)" },
    description: { id: "Bangun aplikasi dari MVP ke full version bertahap", en: "Build applications from MVP to full version step by step" },
    icon: "🏗️",
    technique: "iterative",
    techniqueLabel: { id: "🔄 Iterative Prompt", en: "🔄 Iterative Prompt" },
    initialMessage: {
      id: `Saya ingin membangun aplikasi secara bertahap (iterative). Mari mulai dari MVP:

## PHASE 1: MVP (Minimum Viable Product)
- Fitur paling inti saja
- Tech stack sederhana
- Estimasi waktu: [Target]

## PHASE 2: Core Features
- Fitur tambahan berdasarkan feedback
- Optimasi performance

## PHASE 3: Polish & Scale
- UI/UX improvement
- Testing & documentation
- Deployment & monitoring

Mari mulai dari Phase 1. Aplikasi yang ingin saya bangun:`,
      en: `I want to build an application iteratively. Let's start from MVP:

## PHASE 1: MVP (Minimum Viable Product)
- Core features only
- Simple tech stack
- Time estimate: [Target]

## PHASE 2: Core Features
- Additional features based on feedback
- Performance optimization

## PHASE 3: Polish & Scale
- UI/UX improvement
- Testing & documentation
- Deployment & monitoring

Let's start from Phase 1. The application I want to build:`
    },
    examples: [
      {
        id: "Aplikasi todo list sederhana yang bisa berkembang menjadi project management tool",
        en: "A simple todo list app that can evolve into a project management tool"
      },
      {
        id: "Landing page untuk produk digital yang nantinya jadi full e-commerce",
        en: "Landing page for a digital product that will become a full e-commerce"
      },
      {
        id: "Chat app real-time yang mulai dari 1-to-1 messaging",
        en: "Real-time chat app starting from 1-to-1 messaging"
      },
      {
        id: "Dashboard analytics yang mulai dari simple charts",
        en: "Analytics dashboard starting from simple charts"
      },
    ],
    category: "coding",
  },
  {
    id: "iterative-writing",
    title: { id: "✍️ Content Creator (Iterative)", en: "✍️ Content Creator (Iterative)" },
    description: { id: "Buat konten dari draft pertama hingga final", en: "Create content from first draft to final" },
    icon: "✍️",
    technique: "iterative",
    techniqueLabel: { id: "🔄 Iterative Prompt", en: "🔄 Iterative Prompt" },
    initialMessage: {
      id: `Saya ingin membuat konten secara bertahap:

## STEP 1: Brainstorm & Outline
- Buat list ide dan angle
- Pilih yang paling menarik
- Buat outline

## STEP 2: Draft Pertama
- Tulis full draft berdasarkan outline
- Fokus pada ide, belum ke polish

## STEP 3: Review & Improve
- Review dari sudut pandang reader
- Perbaiki struktur dan flow
- Tambahkan contoh dan data

## STEP 4: Final Polish
- Perbaiki grammar dan tata bahasa
- Optimasi untuk SEO (jika blog)
- Final proofreading

Mari mulai dari Step 1. Konten yang ingin saya buat:`,
      en: `I want to create content step by step:

## STEP 1: Brainstorm & Outline
- List ideas and angles
- Choose the most interesting one
- Create outline

## STEP 2: First Draft
- Write full draft based on outline
- Focus on ideas, not polish yet

## STEP 3: Review & Improve
- Review from reader's perspective
- Fix structure and flow
- Add examples and data

## STEP 4: Final Polish
- Fix grammar and language
- Optimize for SEO (if blog)
- Final proofreading

Let's start from Step 1. The content I want to create:`
    },
    examples: [
      {
        id: "Artikel teknis tentang microservices untuk blog perusahaan",
        en: "Technical article about microservices for company blog"
      },
      {
        id: "Script video YouTube tutorial React untuk pemula",
        en: "YouTube video script for React tutorial for beginners"
      },
      {
        id: "Thread Twitter/X tips karir untuk developer",
        en: "Twitter/X thread career tips for developers"
      },
      {
        id: "Newsletter mingguan untuk komunitas tech",
        en: "Weekly newsletter for tech community"
      },
    ],
    category: "writing",
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. CONSTRAINT-BASED — Aturan dan batasan yang ketat
  // ═══════════════════════════════════════════════════════════════
  {
    id: "constraint-interview",
    title: { id: "🎤 Interview Coach", en: "🎤 Interview Coach" },
    description: { id: "Persiapan wawancara kerja dengan constraint realistis", en: "Job interview preparation with realistic constraints" },
    icon: "🎤",
    technique: "constraint",
    techniqueLabel: { id: "⛔ Constraint-Based", en: "⛔ Constraint-Based" },
    initialMessage: {
      id: `Saya sedang persiapan wawancara kerja. Tolong bantu dengan constraint ini:

## CONSTRAINTS
- Jawaban harus singkat (maks 2 menit saat diucapkan)
- Gunakan metode STAR (Situation, Task, Action, Result)
- Tunjukkan impact yang terukur (angka/percentage)
- Jangan gunakan jargon yang berlebihan
- Tone: confident tapi humble

## FORMAT PERTANYAAN
Untuk setiap pertanyaan, berikan:
1. Analisis: Apa yang sebenarnya ditanyakan
2. Strategi: Cara menjawab dengan efektif
3. Contoh jawaban: 2-3 versi (junior, mid, senior)

Pertanyaan wawancara yang ingin saya latih:`,
      en: `I'm preparing for a job interview. Please help with these constraints:

## CONSTRAINTS
- Answers should be brief (max 2 minutes when spoken)
- Use STAR method (Situation, Task, Action, Result)
- Show measurable impact (numbers/percentages)
- Don't use excessive jargon
- Tone: confident but humble

## QUESTION FORMAT
For each question, provide:
1. Analysis: What's actually being asked
2. Strategy: How to answer effectively
3. Sample answer: 2-3 versions (junior, mid, senior)

The interview question I want to practice:`
    },
    examples: [
      {
        id: "Ceritakan tentang diri Anda (bukan generic, tapi yang impressive)",
        en: "Tell me about yourself (not generic, but impressive)"
      },
      {
        id: "Apa kelemahan terbesar Anda? ( jawaban yang authentic tapi tetap positif)",
        en: "What's your biggest weakness? (authentic but still positive answer)"
      },
      {
        id: "Ceritakan pengalaman Anda menyelesaikan konflik di tim",
        en: "Tell me about your experience resolving a conflict in a team"
      },
      {
        id: "Mengapa Anda tertarik dengan posisi ini?",
        en: "Why are you interested in this position?"
      },
    ],
    category: "general",
  },
  {
    id: "constraint-pitch",
    title: { id: "🎤 30-Second Pitch", en: "🎤 30-Second Pitch" },
    description: { id: "Buat elevator pitch dengan constraint waktu ketat", en: "Create an elevator pitch with strict time constraints" },
    icon: "🎤",
    technique: "constraint",
    techniqueLabel: { id: "⛔ Constraint-Based", en: "⛔ Constraint-Based" },
    initialMessage: {
      id: `Buatkan elevator pitch dengan constraint ketat:

## CONSTRAINTS
- Total waktu: 30 detik (sekitar 75 kata)
- Harus hook dalam 5 detik pertama
- Sebutkan problem, solution, dan unique value
- End dengan call-to-action yang jelas
- Tidak ada jargon teknis yang berlebihan

## STRUCTURE
1. Hook (5 detik): Pertanyaan/provokasi menarik
2. Problem (5 detik): Masalah yang dihadapi target
3. Solution (10 detik): Solusi yang ditawarkan
4. Unique Value (5 detik): Kenapa berbeda
5. CTA (5 detik): Apa yang ingin Anda capai

## FORMAT OUTPUT
Berikan 3 versi pitch:
- Versi casual (untuk networking)
- Versi formal (untuk investor)
- Versi teknis (untuk fellow developers)

Topik pitch:`,
      en: `Create an elevator pitch with strict constraints:

## CONSTRAINTS
- Total time: 30 seconds (about 75 words)
- Must hook in the first 5 seconds
- Mention problem, solution, and unique value
- End with a clear call-to-action
- No excessive technical jargon

## STRUCTURE
1. Hook (5 sec): Interesting question/provocation
2. Problem (5 sec): Problem faced by target audience
3. Solution (10 sec): Solution offered
4. Unique Value (5 sec): Why it's different
5. CTA (5 sec): What you want to achieve

## OUTPUT FORMAT
Provide 3 pitch versions:
- Casual version (for networking)
- Formal version (for investors)
- Technical version (for fellow developers)

Pitch topic:`
    },
    examples: [
      {
        id: "Startup SaaS untuk manajemen proyek remote team",
        en: "SaaS startup for remote team project management"
      },
      {
        id: "Aplikasi mobile untuk belajar coding interaktif",
        en: "Mobile app for interactive coding learning"
      },
      {
        id: "Marketplace UMKM Indonesia go-digital",
        en: "Indonesian SME marketplace going digital"
      },
      {
        id: "Platform freelancer Indonesia dengan sistem escrow",
        en: "Indonesian freelancer platform with escrow system"
      },
    ],
    category: "brainstorm",
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. SHORT/DIRECT — Prompt singkat dan langsung
  // ═══════════════════════════════════════════════════════════════
  {
    id: "short-quick-qa",
    title: { id: "⚡ Quick Q&A", en: "⚡ Quick Q&A" },
    description: { id: "Tanya jawab singkat dan langsung ke inti", en: "Short and direct Q&A" },
    icon: "⚡",
    technique: "short",
    techniqueLabel: { id: "💬 Short Prompt", en: "💬 Short Prompt" },
    initialMessage: {
      id: "Saya punya pertanyaan singkat. Jawab langsung ke inti:",
      en: "I have a short question. Answer directly:"
    },
    examples: [
      {
        id: "Apa perbedaan let, const, dan var di JavaScript?",
        en: "What's the difference between let, const, and var in JavaScript?"
      },
      {
        id: "Bagaimana cara reset password di Linux?",
        en: "How to reset password in Linux?"
      },
      {
        id: "Apa itu CORS dan kenapa sering error?",
        en: "What is CORS and why does it often cause errors?"
      },
      {
        id: "Rekomendasi tool untuk desain UI gratis?",
        en: "Recommendations for free UI design tools?"
      },
    ],
    category: "general",
  },
];

export const TEMPLATE_CATEGORIES = [
  { value: "all", label: { id: "Semua", en: "All" } },
  { value: "coding", label: { id: "💻 Coding", en: "💻 Coding" } },
  { value: "writing", label: { id: "✍️ Menulis", en: "✍️ Writing" } },
  { value: "brainstorm", label: { id: "💡 Ide", en: "💡 Ideas" } },
  { value: "analysis", label: { id: "📊 Analisis", en: "📊 Analysis" } },
  { value: "general", label: { id: "📚 Umum", en: "📚 General" } },
] as const;

export const TECHNIQUE_INFO = {
  persona: {
    name: { id: "Persona Prompt", en: "Persona Prompt" },
    description: { id: "Definisikan peran & spesialisasi AI", en: "Define AI's role & specialization" },
    icon: "🎭",
  },
  "chain-of-thought": {
    name: { id: "Chain-of-Thought", en: "Chain-of-Thought" },
    description: { id: "Berpikir step-by-step untuk masalah kompleks", en: "Think step-by-step for complex problems" },
    icon: "🔗",
  },
  "few-shot": {
    name: { id: "Few-Shot Prompt", en: "Few-Shot Prompt" },
    description: { id: "Berikan contoh untuk diikuti AI", en: "Provide examples for AI to follow" },
    icon: "🎯",
  },
  structured: {
    name: { id: "Structured Prompt", en: "Structured Prompt" },
    description: { id: "Format terstruktur dengan section jelas", en: "Structured format with clear sections" },
    icon: "📐",
  },
  iterative: {
    name: { id: "Iterative Prompt", en: "Iterative Prompt" },
    description: { id: "Bangun secara bertahap dari MVP", en: "Build step by step from MVP" },
    icon: "🔄",
  },
  constraint: {
    name: { id: "Constraint-Based", en: "Constraint-Based" },
    description: { id: "Aturan dan batasan yang ketat", en: "Strict rules and constraints" },
    icon: "⛔",
  },
  short: {
    name: { id: "Short Prompt", en: "Short Prompt" },
    description: { id: "Tanya jawab singkat", en: "Short Q&A" },
    icon: "💬",
  },
} as const;
