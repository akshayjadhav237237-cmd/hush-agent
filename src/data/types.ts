export type Actor = "user" | "gemma" | "claude" | "gemini" | "antigravity" | "human";

export type Step = {
  id: string;
  actor: Actor;
  title: string;
  detail: string;
  terminal: string[];
  gate?: {
    trigger: string;
    reason: string;
    action: string;
  };
};

export type Gate = {
  id: string;
  title: string;
  detects: string;
  action: string;
  icon: string;
};

export type SafetyItem = {
  id: string;
  title: string;
  description: string;
  implemented: boolean;
};

export type Fact = {
  label: string;
  value: string;
  source: string;
};

export type FaqItem = {
  q: string;
  a: string;
};
