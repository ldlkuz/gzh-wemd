/**
 * 组件示例语料的类型声明（独立小文件，避免类型定义体积拖累组件 beused）
 */
export interface ComponentSampleMap {
  [componentId: string]: string[];
}