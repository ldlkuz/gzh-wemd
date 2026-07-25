import type { SectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
import {
  ulStyleOptions,
  olStyleOptions,
  fontSizeOptions,
} from "../../../../config/styleOptions";

const LIST_FONT_SIZE_OPTIONS = [
  { label: "跟随全局", value: "inherit" },
  ...fontSizeOptions.map((opt) => ({ label: opt.label, value: opt.value })),
];

export function ListSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-row">
        <div className="designer-field half">
          <label>一级标识颜色</label>
          <ColorSelector
            value={variables.listMarkerColor}
            presets={[variables.primaryColor]}
            onChange={(color) => updateVariable("listMarkerColor", color)}
          />
        </div>
        <div className="designer-field half">
          <label>二级标识颜色</label>
          <ColorSelector
            value={variables.listMarkerColorL2}
            presets={[variables.primaryColor]}
            onChange={(color) => updateVariable("listMarkerColorL2", color)}
          />
        </div>
      </div>

      <div className="designer-field">
        <label>列表项间距</label>
        <SliderInput
          value={variables.listSpacing}
          onChange={(val) => updateVariable("listSpacing", val)}
          min={0}
          max={20}
          step={2}
        />
      </div>

      <div className="designer-field mt-2">
        <label>无序列表字号</label>
        <div className="designer-options">
          {LIST_FONT_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn ${(variables.ulFontSize ?? "inherit") === opt.value ? "active" : ""}`}
              onClick={() => updateVariable("ulFontSize", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="designer-field">
        <label>有序列表字号</label>
        <div className="designer-options">
          {LIST_FONT_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`option-btn ${(variables.olFontSize ?? "inherit") === opt.value ? "active" : ""}`}
              onClick={() => updateVariable("olFontSize", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="designer-field">
        <label>无序列表符号</label>
        <div className="level-group">
          <span className="level-tag">一级</span>
          <div className="designer-options">
            {ulStyleOptions.map((opt) => (
              <button
                key={opt.value}
                className={`option-btn ${variables.ulStyle === opt.value ? "active" : ""}`}
                onClick={() => updateVariable("ulStyle", opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="level-group mt-2">
          <span className="level-tag">二级</span>
          <div className="designer-options">
            {ulStyleOptions.map((opt) => (
              <button
                key={opt.value + "L2"}
                className={`option-btn ${variables.ulStyleL2 === opt.value ? "active" : ""}`}
                onClick={() => updateVariable("ulStyleL2", opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="designer-field">
        <label>有序列表符号</label>
        <div className="level-group">
          <span className="level-tag">一级</span>
          <div className="designer-options">
            {olStyleOptions.map((opt) => (
              <button
                key={opt.value}
                className={`option-btn ${variables.olStyle === opt.value ? "active" : ""}`}
                onClick={() => updateVariable("olStyle", opt.value)}
              >
                {opt.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="level-group mt-2">
          <span className="level-tag">二级</span>
          <div className="designer-options">
            {olStyleOptions.map((opt) => (
              <button
                key={opt.value + "L2"}
                className={`option-btn ${variables.olStyleL2 === opt.value ? "active" : ""}`}
                onClick={() => updateVariable("olStyleL2", opt.value)}
              >
                {opt.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
