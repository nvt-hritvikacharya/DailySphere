"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { INTERESTS } from "@/lib/interests";
import { cn } from "@/lib/utils";

export function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {INTERESTS.map((i, idx) => {
        const active = value.includes(i.id);
        return (
          <motion.button
            key={i.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.015 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => toggle(i.id)}
            aria-pressed={active}
            className={cn(
              "glass relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition-colors",
              active && "border-primary/60 bg-primary/10 ring-2 ring-primary/40 dark:bg-primary/15",
            )}
          >
            <span className="text-xl" aria-hidden>{i.emoji}</span>
            <span className="flex-1">{i.label}</span>
            {active && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
