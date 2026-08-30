// lib/chat-templates.ts — Pre-defined chat templates with example prompts

export interface ChatTemplate {
  id: string;
  title: { id: string; en: string };
  description: { id: string; en: string };
  icon: string;
  initialMessage: { id: string; en: string };
  examples: { id: string; en: string }[];
  category: "coding" | "writing" | "brainstorm" | "analysis" | "general";
}

export const CHAT_TEMPLATES: ChatTemplate[] = [
  {
    id: "coding-helper",
    title: { id: "💻 Coding Helper", en: "💻 Coding Helper" },
    description: { id: "Bantu debugging, refactor, atau buat code baru", en: "Help debugging, refactoring, or writing new code" },
    icon: "💻",
    initialMessage: {
      id: "Saya butuh bantuan dengan coding. Tolong bantu saya dengan:",
      en: "I need help with coding. Please help me with:"
    },
    examples: [
      {
        id: "Buat function JavaScript untuk validasi email dengan regex",
        en: "Create a JavaScript function to validate email with regex"
      },
      {
        id: "Debug error 'Cannot read property of undefined' di React component saya",
        en: "Debug 'Cannot read property of undefined' error in my React component"
      },
      {
        id: "Refactor kode Python saya agar lebih efisien dan readable",
        en: "Refactor my Python code to be more efficient and readable"
      },
      {
        id: "Buat API endpoint RESTful untuk CRUD produk dengan Node.js dan Express",
        en: "Create a RESTful CRUD API endpoint for products with Node.js and Express"
      },
    ],
    category: "coding",
  },
  {
    id: "writing-assistant",
    title: { id: "✍️ Writing Assistant", en: "✍️ Writing Assistant" },
    description: { id: "Bantu menulis artikel, email, atau konten lainnya", en: "Help writing articles, emails, or other content" },
    icon: "✍️",
    initialMessage: {
      id: "Saya ingin menulis. Tolong bantu saya menulis:",
      en: "I want to write. Please help me write:"
    },
    examples: [
      {
        id: "Tulis email profesional untuk menawarkan jasa web development ke klien",
        en: "Write a professional email to offer web development services to a client"
      },
      {
        id: "Buat artikel blog tentang tips produktivitas untuk developer",
        en: "Write a blog article about productivity tips for developers"
      },
      {
        id: "Tulis proposal proyek untuk aplikasi mobile e-commerce",
        en: "Write a project proposal for a mobile e-commerce application"
      },
      {
        id: "Buat draft press release untuk peluncuran produk baru",
        en: "Write a draft press release for a new product launch"
      },
    ],
    category: "writing",
  },
  {
    id: "brainstorm",
    title: { id: "💡 Brainstorming Partner", en: "💡 Brainstorming Partner" },
    description: { id: "Eksplorasi ide dan temukan solusi kreatif", en: "Explore ideas and find creative solutions" },
    icon: "💡",
    initialMessage: {
      id: "Saya punya ide yang ingin saya eksplorasi. Mari kita brainstorm:",
      en: "I have an idea I want to explore. Let's brainstorm:"
    },
    examples: [
      {
        id: "Saya ingin membuat aplikasi yang membantu orang belajar bahasa asing. Bagaimana caranya?",
        en: "I want to create an app that helps people learn foreign languages. How should I approach it?"
      },
      {
        id: "Bantu saya brainstorm fitur-fitur untuk aplikasi productivity yang unik",
        en: "Help me brainstorm unique features for a productivity app"
      },
      {
        id: "Saya punya ide bisnis online shop tapi bingung mulai dari mana",
        en: "I have an online shop business idea but don't know where to start"
      },
      {
        id: "Bagaimana cara membuat konten TikTok yang menarik untuk developer?",
        en: "How to create engaging TikTok content for developers?"
      },
    ],
    category: "brainstorm",
  },
  {
    id: "business-analysis",
    title: { id: "📊 Business Analysis", en: "📊 Business Analysis" },
    description: { id: "Analisis bisnis, strategi, dan rencana tindakan", en: "Business analysis, strategy, and action plans" },
    icon: "📊",
    initialMessage: {
      id: "Saya butuh analisis bisnis untuk:",
      en: "I need business analysis for:"
    },
    examples: [
      {
        id: "Analisis SWOT untuk startup saya di bidang edtech",
        en: "SWOT analysis for my startup in the edtech sector"
      },
      {
        id: "Buat business plan sederhana untuk café online",
        en: "Create a simple business plan for an online café"
      },
      {
        id: "Analisis kompetitor untuk aplikasi fitness saya",
        en: "Competitor analysis for my fitness application"
      },
      {
        id: "Strategi pricing untuk SaaS product yang baru diluncurkan",
        en: "Pricing strategy for a newly launched SaaS product"
      },
    ],
    category: "analysis",
  },
  {
    id: "idea-coach",
    title: { id: "🎯 Idea Coach", en: "🎯 Idea Coach" },
    description: { id: "Coaching untuk mengembangkan ide menjadi rencana", en: "Coaching to develop ideas into plans" },
    icon: "🎯",
    initialMessage: {
      id: "Saya punya ide yang ingin saya kembangkan. Bantu saya:",
      en: "I have an idea I want to develop. Help me:"
    },
    examples: [
      {
        id: "Saya punya ide aplikasi tapi tidak tahu apakah layak dijual. Bantu saya validasi",
        en: "I have an app idea but don't know if it's viable. Help me validate it"
      },
      {
        id: "Ide saya tentang platform belajar coding. Bantu saya buat action plan",
        en: "My idea is about a coding learning platform. Help me create an action plan"
      },
      {
        id: "Saya ingin mengubah hobi saya menjadi bisnis. Bantu saya langkah-langkahnya",
        en: "I want to turn my hobby into a business. Help me with the steps"
      },
      {
        id: "Bantu saya develop ide dari brainstorming kemarin menjadi rencana konkret",
        en: "Help me develop yesterday's brainstorming idea into a concrete plan"
      },
    ],
    category: "brainstorm",
  },
  {
    id: "learning-buddy",
    title: { id: "📚 Learning Buddy", en: "📚 Learning Buddy" },
    description: { id: "Belajar topik baru dengan penjelasan bertahap", en: "Learn new topics with step-by-step explanations" },
    icon: "📚",
    initialMessage: {
      id: "Saya ingin belajar tentang:",
      en: "I want to learn about:"
    },
    examples: [
      {
        id: "Jelaskan konsep Machine Learning dari dasar sampai bisa dipraktikkan",
        en: "Explain Machine Learning concepts from basics to practical application"
      },
      {
        id: "Saya ingin belajar React. Mulai dari mana dan bagaimana cara belajarnya?",
        en: "I want to learn React. Where to start and how to learn it?"
      },
      {
        id: "Apa itu Docker dan bagaimana cara menggunakannya untuk deploy aplikasi?",
        en: "What is Docker and how to use it for application deployment?"
      },
      {
        id: "Bantu saya pahami algoritma sorting dengan bahasa sederhana",
        en: "Help me understand sorting algorithms in simple terms"
      },
    ],
    category: "general",
  },
  {
    id: "document-review",
    title: { id: "📝 Document Review", en: "📝 Document Review" },
    description: { id: "Review dan improve dokumen yang sudah ada", en: "Review and improve existing documents" },
    icon: "📝",
    initialMessage: {
      id: "Saya punya dokumen yang ingin saya review. Tolong bantu:",
      en: "I have a document I want to review. Please help:"
    },
    examples: [
      {
        id: "Review CV saya dan berikan saran untuk perbaikan",
        en: "Review my CV and provide suggestions for improvement"
      },
      {
        id: "Tolong perbaiki tata bahasa dan struktur artikel saya",
        en: "Please fix the grammar and structure of my article"
      },
      {
        id: "Review proposal bisnis saya dan berikan feedback yang jujur",
        en: "Review my business proposal and give honest feedback"
      },
      {
        id: "Perbaiki email formal saya agar lebih profesional",
        en: "Fix my formal email to be more professional"
      },
    ],
    category: "writing",
  },
  {
    id: "project-planner",
    title: { id: "🗓️ Project Planner", en: "🗓️ Project Planner" },
    description: { id: "Rencanakan proyek dari awal hingga selesai", en: "Plan a project from start to finish" },
    icon: "🗓️",
    initialMessage: {
      id: "Saya ingin merencanakan proyek baru. Bantu saya:",
      en: "I want to plan a new project. Help me:"
    },
    examples: [
      {
        id: "Buat project plan untuk membuat website portfolio dalam 2 minggu",
        en: "Create a project plan to build a portfolio website in 2 weeks"
      },
      {
        id: "Rencanakan milestone untuk aplikasi mobile yang akan saya buat",
        en: "Plan milestones for the mobile app I'm going to build"
      },
      {
        id: "Bantu saya buat timeline untuk launch produk digital",
        en: "Help me create a timeline for a digital product launch"
      },
      {
        id: "Rencanakan sprint pertama untuk proyek tim kecil (3 orang)",
        en: "Plan the first sprint for a small team project (3 people)"
      },
    ],
    category: "analysis",
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
