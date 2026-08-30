"use client";

import { useState } from "react";
import { PERSONAS, type PersonaId, getPersona } from "@/lib/personas";
import { t } from "@/lib/i18n";

interface PersonaSwitcherProps {
  selectedPersona: PersonaId;
  onSelect: (personaId: PersonaId) => void;
}

export default function PersonaSwitcher({
  selectedPersona,
  onSelect,
}: PersonaSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentPersona = getPersona(selectedPersona);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-input-bg hover:bg-surface-hover transition-colors"
        title={t("selectPersona")}
      >
        <span>{currentPersona.icon}</span>
        <span className="hidden sm:inline">
          {currentPersona.name.id}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {t("selectPersona")}
              </h3>
              <p className="text-xs text-muted mt-1">
                {t("personaDescription")}
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    onSelect(persona.id as PersonaId);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPersona === persona.id
                      ? "bg-accent-bg border border-accent"
                      : "hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{persona.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {persona.name.id}
                        </span>
                        {selectedPersona === persona.id && (
                          <span className="text-xs text-accent">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">
                        {persona.description.id}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
