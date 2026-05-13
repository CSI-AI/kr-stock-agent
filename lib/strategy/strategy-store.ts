import {
  createDefaultScoreWeightSet,
  createDefaultStockFilterSet,
  createDefaultStrategyPreset,
  mergeFilterSet,
  mergeWeightSet,
  type StrategyPreset,
  type StrategyPresetInput,
} from "@/types/filters";

const STORAGE_KEY = "kr-stock-agent.strategy-presets";

function generatePresetId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(raw: string | null): StrategyPreset[] {
  if (!raw) {
    return [createDefaultStrategyPreset()];
  }

  try {
    const parsed = JSON.parse(raw) as StrategyPreset[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createDefaultStrategyPreset()];
    }

    return parsed;
  } catch {
    return [createDefaultStrategyPreset()];
  }
}

export function getStrategyPresets(): StrategyPreset[] {
  if (typeof window === "undefined") {
    return [createDefaultStrategyPreset()];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
}

export function saveStrategyPresets(presets: StrategyPreset[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function createStrategyPreset(
  input: StrategyPresetInput
): StrategyPreset {
  const now = new Date().toISOString();

  return {
    id: generatePresetId(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    filters: mergeFilterSet(createDefaultStockFilterSet(), input.filters),
    weights: mergeWeightSet(createDefaultScoreWeightSet(), input.weights),
    isDefault: input.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  };
}

export function addStrategyPreset(input: StrategyPresetInput): StrategyPreset[] {
  const current = getStrategyPresets();
  const created = createStrategyPreset(input);

  const next = [...current, created];
  saveStrategyPresets(next);

  return next;
}

export function updateStrategyPreset(
  presetId: string,
  patch: Partial<StrategyPresetInput>
): StrategyPreset[] {
  const current = getStrategyPresets();

  const next = current.map((preset) => {
    if (preset.id !== presetId) {
      return preset;
    }

    return {
      ...preset,
      name: patch.name?.trim() ?? preset.name,
      description: patch.description?.trim() ?? preset.description,
      filters: mergeFilterSet(preset.filters, patch.filters),
      weights: mergeWeightSet(preset.weights, patch.weights),
      isDefault: patch.isDefault ?? preset.isDefault,
      updatedAt: new Date().toISOString(),
    };
  });

  saveStrategyPresets(next);
  return next;
}

export function deleteStrategyPreset(presetId: string): StrategyPreset[] {
  const current = getStrategyPresets();
  const filtered = current.filter((preset) => preset.id !== presetId);

  const next =
    filtered.length > 0 ? filtered : [createDefaultStrategyPreset()];

  saveStrategyPresets(next);
  return next;
}

export function setDefaultStrategyPreset(
  presetId: string
): StrategyPreset[] {
  const current = getStrategyPresets();

  const next = current.map((preset) => ({
    ...preset,
    isDefault: preset.id === presetId,
    updatedAt: new Date().toISOString(),
  }));

  saveStrategyPresets(next);
  return next;
}

export function getDefaultStrategyPreset(): StrategyPreset {
  const presets = getStrategyPresets();

  return (
    presets.find((preset) => preset.isDefault) ??
    presets[0] ??
    createDefaultStrategyPreset()
  );
}