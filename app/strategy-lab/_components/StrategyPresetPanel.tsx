import type { StrategyPreset } from "@/types/filters";

type StrategyPresetPanelProps = {
  presets: StrategyPreset[];
  selectedPresetId: string;
  draftName: string;
  draftDescription: string;
  onPresetSelect: (presetId: string) => void;
  onDraftNameChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onSaveNewPreset: () => void;
  onUpdatePreset: () => void;
  onSetDefault: () => void;
  onDeletePreset: () => void;
  onResetDraft: () => void;
};

export default function StrategyPresetPanel({
  presets,
  selectedPresetId,
  draftName,
  draftDescription,
  onPresetSelect,
  onDraftNameChange,
  onDraftDescriptionChange,
  onSaveNewPreset,
  onUpdatePreset,
  onSetDefault,
  onDeletePreset,
  onResetDraft,
}: StrategyPresetPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">전략 설정</h2>

      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700">
          저장된 전략
        </label>

        <select
          value={selectedPresetId}
          onChange={(e) => onPresetSelect(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
        >
          <option value="">새 전략 작성</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
              {preset.isDefault ? " (기본)" : ""}
            </option>
          ))}
        </select>

        <label className="mt-2 text-sm font-medium text-slate-700">
          전략 이름
        </label>
        <input
          value={draftName}
          onChange={(e) => onDraftNameChange(e.target.value)}
          placeholder="예: 저PER 고ROE 전략"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
        />

        <label className="mt-2 text-sm font-medium text-slate-700">
          설명
        </label>
        <textarea
          value={draftDescription}
          onChange={(e) => onDraftDescriptionChange(e.target.value)}
          rows={3}
          placeholder="전략 설명을 입력하세요."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onSaveNewPreset}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          >
            새 전략 저장
          </button>

          <button
            onClick={onUpdatePreset}
            className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
          >
            현재 전략 수정
          </button>

          <button
            onClick={onSetDefault}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            기본 전략 지정
          </button>

          <button
            onClick={onDeletePreset}
            className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
          >
            전략 삭제
          </button>
        </div>

        <button
          onClick={onResetDraft}
          className="mt-3 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium"
        >
          새 전략 초기화
        </button>
      </div>
    </div>
  );
}