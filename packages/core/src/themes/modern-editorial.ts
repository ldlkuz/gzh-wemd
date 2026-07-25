import { modernEditorialContentTheme } from "./modern-editorial-content";
import { modernEditorialFoundationTheme } from "./modern-editorial-foundation";
import { modernEditorialComponentsTheme } from "./modern-editorial-components";

export const modernEditorialTheme = [
  modernEditorialFoundationTheme,
  modernEditorialContentTheme,
  modernEditorialComponentsTheme,
].join("\n");
