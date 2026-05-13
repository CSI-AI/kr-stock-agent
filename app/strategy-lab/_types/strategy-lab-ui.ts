export type FilterHintKey =
  | "per"
  | "pbr"
  | "roe"
  | "revenueGrowth"
  | "operatingIncomeGrowth"
  | "debtRatio"
  | "dividendYield"
  | "marketCapBillionKrw";

export type PresetQuickValue = {
  min: number | null;
  max: number | null;
};

export type FilterQuickPresetName = "보수적" | "균형" | "공격적";

export type FilterFieldConfig = {
  key: FilterHintKey;
  label: string;
  hint: string;
  quickPresets: Record<FilterQuickPresetName, PresetQuickValue>;
};