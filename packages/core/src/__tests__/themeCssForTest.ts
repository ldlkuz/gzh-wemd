import { componentStylesDefault } from "../themes/components-default";
import { componentStylesExtra } from "../themes/components-extra";
import { componentStylesExtended } from "../themes/components-extended";
import { componentStylesFaq } from "../themes/components-faq";
import { componentStylesMagazine } from "../themes/components-magazine";

/** 测试辅助：拼接全部内置组件 CSS（与 ThemeRenderer 的 injectComponentStyles 一致） */
export function getComponentCss(): string {
  return [
    componentStylesDefault,
    componentStylesExtra,
    componentStylesExtended,
    componentStylesFaq,
    componentStylesMagazine,
  ].join("\n\n");
}
