"use client";

import { useState } from "react";
import { CHAT_TEMPLATES, TEMPLATE_CATEGORIES, type ChatTemplate } from "@/lib/chat-templates";

interface ChatTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ChatTemplate) => void;
  lang: "id" | "en";
}

export default function ChatTemplates({ isOpen, onClose, onSelect, lang }: ChatTemplatesProps) {
  const [filter, setFilter] = useState("all");

  if (!isOpen) return null;

  const filteredTemplates = filter === "all"
    ? CHAT_TEMPLATES
    : CHAT_TEMPLATES.filter((t) => t.category === filter);

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
              {lang === "id" ? "Template Percakapan" : "Chat Templates"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                className="text-left p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm group-hover:text-blue-400 transition-colors">
                      {template.title[lang]}
                    </h3>
                    <p className="text-xs text-muted mt-1 line-clamp-2">
                      {template.description[lang]}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
