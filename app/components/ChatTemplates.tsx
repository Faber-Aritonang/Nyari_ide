"use client";

import { useState } from "react";
import { CHAT_TEMPLATES, TEMPLATE_CATEGORIES, TECHNIQUE_INFO, type ChatTemplate } from "@/lib/chat-templates";

interface ChatTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ChatTemplate, examplePrompt?: string) => void;
  lang: "id" | "en";
}

export default function ChatTemplates({ isOpen, onClose, onSelect, lang }: ChatTemplatesProps) {
  const [filter, setFilter] = useState("all");
  const [techniqueFilter, setTechniqueFilter] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTemplates = CHAT_TEMPLATES.filter((t) => {
    const categoryMatch = filter === "all" || t.category === filter;
    const techniqueMatch = !techniqueFilter || t.technique === techniqueFilter;
    return categoryMatch && techniqueMatch;
  });

  // Get unique techniques from filtered templates
  const techniques = [...new Set(CHAT_TEMPLATES.map((t) => t.technique))];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-background rounded-xl z-50 flex flex-col overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-semibold">
              {lang === "id" ? "Template & Teknik Prompting" : "Templates & Prompting Techniques"}
            </h2>
            <span className="text-xs text-muted bg-muted px-2 py-0.5 rounded-full">
              {CHAT_TEMPLATES.length} {lang === "id" ? "template" : "templates"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Technique info banner */}
        <div className="px-4 py-2 bg-blue-600/10 border-b border-border">
          <p className="text-xs text-blue-400 font-medium mb-1">
            {lang === "id" ? "🎓 7 Teknik Prompting yang Tersedia:" : "🎓 7 Available Prompting Techniques:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {techniques.map((tech) => (
              <button
                key={tech}
                onClick={() => setTechniqueFilter(techniqueFilter === tech ? null : tech)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  techniqueFilter === tech
                    ? "bg-blue-600 text-white"
                    : "bg-background hover:bg-surface-hover border border-border"
                }`}
              >
                {TECHNIQUE_INFO[tech].icon} {TECHNIQUE_INFO[tech].name[lang]}
              </button>
            ))}
            {techniqueFilter && (
              <button
                onClick={() => setTechniqueFilter(null)}
                className="px-2 py-0.5 text-xs rounded bg-red-600/20 text-red-400 hover:bg-red-600/30"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                filter === cat.value ? "bg-blue-600 text-white" : "bg-muted hover:bg-surface-hover"
              }`}
            >
              {cat.label[lang]}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <div className="flex-1 overflow-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted">
              <span className="text-4xl mb-4">🔍</span>
              <p>{lang === "id" ? "Tidak ada template yang cocok" : "No matching templates"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors overflow-hidden"
                >
                  {/* Template header */}
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                    className="w-full text-left p-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm group-hover:text-blue-400 transition-colors">
                            {template.title[lang]}
                          </h3>
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {template.description[lang]}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                            {TECHNIQUE_INFO[template.technique].icon} {template.techniqueLabel[lang]}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted">
                        {expandedTemplate === template.id ? "▼" : "▶"}
                      </span>
                    </div>
                  </button>

                  {/* Example prompts (expanded) */}
                  {expandedTemplate === template.id && (
                    <div className="px-4 pb-4 border-t border-border">
                      <p className="text-xs text-muted mt-3 mb-2 font-medium">
                        {lang === "id" ? "💡 Contoh prompt:" : "💡 Example prompts:"}
                      </p>
                      <div className="space-y-2">
                        {template.examples.map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              onSelect(template, example[lang]);
                              onClose();
                            }}
                            className="w-full text-left p-2 text-xs bg-background hover:bg-blue-600/20 hover:border-blue-500 border border-border rounded-lg transition-colors"
                          >
                            <span className="text-muted-light">→</span>{" "}
                            {example[lang]}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          onSelect(template);
                          onClose();
                        }}
                        className="w-full mt-3 p-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                      >
                        {lang === "id" ? "Mulai dengan template ini" : "Start with this template"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border text-center">
          <p className="text-xs text-muted">
            {lang === "id"
              ? "💡 Filter berdasarkan teknik untuk menemukan prompt yang tepat untuk kebutuhan Anda"
              : "💡 Filter by technique to find the right prompt for your needs"}
          </p>
        </div>
      </div>
    </>
  );
}
