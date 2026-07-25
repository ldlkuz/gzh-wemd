import type { SectionProps } from "../types";

import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";

export function ParagraphSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-field">
        <label>段落间距</label>
        <SliderInput
          value={variables.paragraphMargin}
          onChange={(val) => updateVariable("paragraphMargin", val)}
          min={8}
          max={32}
          step={2}
        />
      </div>

      <div className="designer-field-row">
        <span>段落首行缩进</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.textIndent}
            onChange={(e) => updateVariable("textIndent", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>

      <div className="designer-field-row">
        <span>两端对齐</span>
        <label className="designer-switch">
          <input
            type="checkbox"
            checked={variables.textJustify}
            onChange={(e) => updateVariable("textJustify", e.target.checked)}
          />
          <span className="switch-slider"></span>
        </label>
      </div>

      <div className="designer-group-label mt-4">分割线</div>
      <div className="designer-field">
        <label>样式</label>
        <div className="designer-options col-3">
          {[
            { id: "solid", label: "实线" },
            { id: "dashed", label: "虚线" },
            { id: "dotted", label: "点线" },
            { id: "double", label: "双线" },
            { id: "pill", label: "短线" },
          ].map((style) => (
            <button
              key={style.id}
              className={`option-btn ${variables.hrStyle === style.id ? "active" : ""}`}
              onClick={() => updateVariable("hrStyle", style.id as any)}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
      <div className="designer-field">
        <label>颜色</label>
        <ColorSelector
          value={variables.hrColor}
          presets={["#eee", "#ddd", "#ccc", variables.primaryColor]}
          onChange={(color) => updateVariable("hrColor", color)}
        />
      </div>
      <div className="designer-field">
        <label>高度</label>
        <SliderInput
          value={variables.hrHeight}
          onChange={(val) => updateVariable("hrHeight", val)}
          min={1}
          max={4}
        />
      </div>
      <div className="designer-field">
        <label>上下边距</label>
        <SliderInput
          value={variables.hrMargin}
          onChange={(val) => updateVariable("hrMargin", val)}
          min={10}
          max={60}
          step={5}
        />
      </div>
    </div>
  );
}
