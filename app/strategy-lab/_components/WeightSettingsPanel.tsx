import type { ScoreWeightSet } from "@/types/filters";

type WeightSettingsPanelProps = {
  weights: ScoreWeightSet;
  onWeightChange: (key: keyof ScoreWeightSet, value: string) => void;
};

const WEIGHT_FIELDS: Array<{
  key: keyof ScoreWeightSet;
  label: string;
}> = [
  { key: "financialQuality", label: "재무 퀄리티" },
  { key: "growth", label: "성장성" },
  { key: "value", label: "밸류" },
  { key: "shareholderReturn", label: "주주환원" },
  { key: "profitabilityStability", label: "수익성 안정성" },
];

export default function WeightSettingsPanel({
  weights,
  onWeightChange,
}: WeightSettingsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">가중치 설정</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {WEIGHT_FIELDS.map(({ key, label }) => (
          <div key={key} className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 text-sm font-medium text-slate-700">
              {label}
            </div>
            <input
              value={String(weights[key])}
              onChange={(e) => onWeightChange(key, e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}