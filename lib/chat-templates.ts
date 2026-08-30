// lib/chat-templates.ts — Pre-defined chat templates

export interface ChatTemplate {
  id: string;
  title: { id: string; en: string };
  description: { id: string; en: string };
  icon: string;
  initialMessage: { id: string; en: string };
  category: "coding" | "writing" | "brainstorm" | "analysis" | "general";
}

export const CHAT_TEMPLATES: ChatTemplate[] = [
  {
    id: "coding-helper",
    title: { id: "Coding Helper", en: "Coding Helper" },
    description: { id: "Bantu debugging, refactor, atau buat code baru", en: "Help debugging, refactoring, or writing new code" },
    icon: "💻",
    initialMessage: {
      id: "Saya butuh bantuan dengan coding. Tolong bantu saya dengan:",
      en: "I need help with coding. Please help me with:"
    },
    category: "coding",
  },
  {
    id: "writing-assistant",
    title: { id: "Writing Assistant", en: "Writing Assistant" },
    description: { id: "Bantu menulis artikel, email, atau konten lainnya", en: "Help writing articles, emails, or other content" },
    icon: "✍️",
    initialMessage: {
      id: "Saya ingin menulis. Tolong bantu saya menulis:",
      en: "I want to write. Please help me write:"
    },
    category: "writing",
  },
  {
    id: "brainstorm",
    title: { id: "Brainstorming Partner", en: "Brainstorming Partner" },
    description: { id: "Eksplorasi ide dan temukan solusi kreatif", en: "Explore ideas and find creative solutions" },
    icon: "💡",
    initialMessage: {
      id: "Saya punya ide yang ingin saya eksplorasi. Mari kita brainstorm:",
      en: "I have an idea I want to explore. Let's brainstorm:"
    },
    category: "brainstorm",
  },
  {
    id: "business-analysis",
    title: { id: "Business Analysis", en: "Business Analysis" },
    description: { id: "Analisis bisnis, strategi, dan rencana tindakan", en: "Business analysis, strategy, and action plans" },
    icon: "📊",
    initialMessage: {
      id: "Saya butuh analisis bisnis untuk:",
      en: "I need business analysis for:"
    },
    category: "analysis",
  },
  {
    id: "idea-coach",
    title: { id: "Idea Coach", en: "Idea Coach" },
    description: { id: "Coaching untuk mengembangkan ide menjadi rencana", en: "Coaching to develop ideas into plans" },
    icon: "🎯",
    initialMessage: {
      id: "Saya punya ide yang ingin saya kembangkan. Bantu saya:",
      en: "I have an idea I want to develop. Help me:"
    },
    category: "brainstorm",
  },
  {
    id: "learning-buddy",
    title: { id: "Learning Buddy", en: "Learning Buddy" },
    description: { id: "Belajar topik baru dengan penjelasan bertahap", en: "Learn new topics with step-by-step explanations" },
    icon: "📚",
    initialMessage: {
      id: "Saya ingin belajar tentang:",
      en: "I want to learn about:"
    },
    category: "general",
  },
  {
    id: "document-review",
    title: { id: "Document Review", en: "Document Review" },
    description: { id: "Review dan improve dokumen yang sudah ada", en: "Review and improve existing documents" },
    icon: "📝",
    initialMessage: {
      id: "Saya punya dokumen yang ingin saya review. Tolong bantu:",
      en: "I have a document I want to review. Please help:"
    },
    category: "writing",
  },
  {
    id: "project-planner",
    title: { id: "Project Planner", en: "Project Planner" },
    description: { id: "Rencanakan proyek dari awal hingga selesai", en: "Plan a project from start to finish" },
    icon: "🗓️",
    initialMessage: {
      id: "Saya ingin merencanakan proyek baru. Bantu saya:",
      en: "I want to plan a new project. Help me:"
    },
    category: "analysis",
  },
];

export const TEMPLATE_CATEGORIES = [
  { value: "all", label: { id: "Semua", en: "All" } },
  { value: "coding", label: { id: "Coding", en: "Coding" } },
  { value: "writing", label: { id: "Menulis", en: "Writing" } },
  { value: "brainstorm", label: { id: "Ide", en: "Ideas" } },
  { value: "analysis", label: { id: "Analisis", en: "Analysis" } },
  { value: "general", label: { id: "Umum", en: "General" } },
] as const;
