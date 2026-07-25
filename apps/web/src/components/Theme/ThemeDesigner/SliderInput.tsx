import { useState, useEffect } from "react";

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

/**
 * 滑块+数字输入组件，支持拖动滑块或直接输入数字
 */
export function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "px",
}: SliderInputProps) {
  const [inputValue, setInputValue] = useState(
    value === undefined || value === null ? "" : String(value),
  );

  // 同步外部 value 变化到输入框
  useEffect(() => {
    setInputValue(value === undefined || value === null ? "" : String(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const num = Number(inputValue);
    if (!isNaN(num)) {
      // 限制在 min-max 范围内
      const clamped = Math.min(max, Math.max(min, num));
      onChange(clamped);
      setInputValue(String(clamped));
    } else {
      // 无效输入，恢复原值
      setInputValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  return (
    <div className="slider-input-wrapper">
      <input
        type="range"
        className="designer-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="slider-input-box">
        <input
          type="text"
          className="slider-number-input"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
        <span className="slider-input-unit">{unit}</span>
      </div>
    </div>
  );
}
