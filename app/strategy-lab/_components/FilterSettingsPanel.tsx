import type { NumericRange, StockFilterSet } from "@/types/filters";
import type {
  FilterFieldConfig,
  FilterHintKey,
  FilterQuickPresetName,
} from "../_types/strategy-lab-ui";

type ActiveFilterChip = {
  label: string;
  value: string;
};

type FilterSettingsPanelProps = {
  filters: StockFilterSet;
  fieldConfigs: FilterFieldConfig[];
  activeFilterChips: ActiveFilterChip[];
  onApplyQuickPreset: (
    key: FilterHintKey,
    presetName: FilterQuickPresetName
  ) => void;
  onRangeChange: (
    key: FilterHintKey,
    part: "min" | "max",
    value: string
  ) => void;
  onIndustryChange: (raw: string) => void;
  onMarketToggle: (market: "KOSPI" | "KOSDAQ" | "KONEX" | "ETF") => void;
};

function rangeInputValue(value: number | null): string {
  return value === null ? "" : String(value);
}

export default function FilterSettingsPanel({
  filters,
  fieldConfigs,
  activeFilterChips,
  onApplyQuickPreset,
  onRangeChange,
  onIndustryChange,
  onMarketToggle,
}: FilterSettingsPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">필터 설정</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {fieldConfigs.map(({ key, label, hint }) => {
          const range = filters[key] as NumericRange;

          return (
            <div
              key={key}
              className="col-span-2 rounded-xl border border-slate-200 p-3"
            >
              <div className="mb-2 flex flex-col gap-1">
                <div className="text-sm font-medium text-slate-700">
                  {label}
                </div>
                <div className="text-xs text-slate-500">{hint}</div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {(["보수적", "균형", "공격적"] as FilterQuickPresetName[]).map(
                  (presetName) => (
                    <button
                      key={presetName}
                      type="button"
                      onClick={() => onApplyQuickPreset(key, presetName)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {presetName}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rangeInputValue(range.min)}
                  onChange={(e) => onRangeChange(key, "min", e.target.value)}
                  placeholder="최소"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                />
                <input
                  value={rangeInputValue(range.max)}
                  onChange={(e) => onRangeChange(key, "max", e.target.value)}
                  placeholder="최대"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
          );
        })}

        <div className="col-span-2 rounded-xl border border-slate-200 p-3">
          <div className="mb-2 text-sm font-medium text-slate-700">
            업종 필터
          </div>
          <input
            value={filters.industries.join(", ")}
            onChange={(e) => onIndustryChange(e.target.value)}
            placeholder="예: 반도체, 자동차, 은행"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        <div className="col-span-2 rounded-xl border border-slate-200 p-3">
          <div className="mb-3 text-sm font-medium text-slate-700">
            시장구분
          </div>

          <div className="flex flex-wrap gap-2">
            {(["KOSPI", "KOSDAQ", "KONEX", "ETF"] as const).map((market) => {
              const active = filters.markets.includes(market);

              return (
                <button
                  key={market}
                  type="button"
                  onClick={() => onMarketToggle(market)}
                  className={`rounded-full px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {market}
                </button>
              );
            })}
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="col-span-2 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <div
                key={`${chip.label}-${chip.value}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="font-semibold text-slate-800">
                  {chip.label}
                </span>
                <span className="ml-2 text-slate-600">{chip.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}