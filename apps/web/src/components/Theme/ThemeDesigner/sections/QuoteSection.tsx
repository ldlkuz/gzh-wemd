import type { SectionProps } from "../types";
import { ColorSelector } from "../../ColorSelector";
import { SliderInput } from "../SliderInput";
import { Switch } from "../Switch";
import { quoteStylePresets } from "../../../../config/styleOptions";

export function QuoteSection({ variables, updateVariable }: SectionProps) {
  return (
    <div className="designer-section">
      <div className="designer-field">
        <label>样式预设</label>
        <div className="designer-options">
          {quoteStylePresets.map((opt) => (
            <button
              key={opt.id}
              className={`option-btn ${variables.quotePreset === opt.id ? "active" : ""}`}
              onClick={() => updateVariable("quotePreset", opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 边框样式 - 除大引号和中心强调外的预设可用 */}
      {!["quotation-marks", "center-accent"].includes(
        variables.quotePreset,
      ) && (
        <div className="designer-field">
          <label>边框样式</label>
          <div className="designer-options">
            {[
              { id: "solid", label: "实线" },
              { id: "dashed", label: "虚线" },
              { id: "dotted", label: "点线" },
              { id: "double", label: "双线" },
            ].map((style) => (
              <button
                key={style.id}
                className={`option-btn ${variables.quoteBorderStyle === style.id ? "active" : ""}`}
                onClick={() =>
                  updateVariable(
                    "quoteBorderStyle",
                    style.id as "solid" | "dashed" | "dotted" | "double",
                  )
                }
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 边框粗细 - 除大引号外的所有预设可用 */}
      {variables.quotePreset !== "quotation-marks" && (
        <div className="designer-field">
          <label>边框粗细</label>
          <SliderInput
            value={variables.quoteBorderWidth}
            onChange={(val) => updateVariable("quoteBorderWidth", val)}
            min={1}
            max={8}
            step={0.1}
          />
        </div>
      )}

      <div className="designer-row">
        <div className="designer-field half">
          <label>引用背景</label>
          <ColorSelector
            value={variables.quoteBackground}
            presets={[
              "transparent",
              "#f5f5f5",
              "#f0f9ff",
              "#f0fdf4",
              "#fef3c7",
              "#fce7f3",
            ]}
            onChange={(color) => updateVariable("quoteBackground", color)}
          />
        </div>

        <div className="designer-field half">
          <label>边框颜色</label>
          <ColorSelector
            value={variables.quoteBorderColor}
            presets={[
              "#ddd",
              "#0ea5e9",
              "#22c55e",
              "#f59e0b",
              "#ec4899",
              variables.primaryColor,
            ]}
            onChange={(color) => updateVariable("quoteBorderColor", color)}
          />
        </div>
      </div>

      <div className="designer-field">
        <label>引用文字颜色</label>
        <ColorSelector
          value={variables.quoteTextColor}
          presets={["#666", "#333", "#000", variables.primaryColor]}
          onChange={(color) => updateVariable("quoteTextColor", color)}
        />
      </div>

      <div className="designer-group-label mt-4">内部间距</div>
      <div className="designer-row">
        <div className="designer-field half">
          <label>水平间距</label>
          <SliderInput
            value={variables.quotePaddingX}
            onChange={(val) => updateVariable("quotePaddingX", val)}
            min={8}
            max={32}
          />
        </div>
        <div className="designer-field half">
          <label>垂直间距</label>
          <SliderInput
            value={variables.quotePaddingY}
            onChange={(val) => updateVariable("quotePaddingY", val)}
            min={8}
            max={32}
          />
        </div>
      </div>

      <div className="designer-group-label mt-4">引用文字</div>
      <div className="designer-field-row">
        <span>内容居中</span>
        <Switch
          checked={variables.quoteTextCentered}
          onChange={(val) => updateVariable("quoteTextCentered", val)}
        />
      </div>

      <div className="designer-field">
        <label>字体大小</label>
        <SliderInput
          value={variables.quoteFontSize}
          onChange={(val) => updateVariable("quoteFontSize", val)}
          min={12}
          max={20}
          step={0.1}
        />
      </div>

      <div className="designer-field">
        <label>行高</label>
        <SliderInput
          value={variables.quoteLineHeight ?? 1.6}
          onChange={(val) => updateVariable("quoteLineHeight", val)}
          min={1.2}
          max={2.5}
          step={0.05}
          unit=""
        />
      </div>
    </div>
  );
}
