/**
 * 杂志级组件样式
 *
 * 组件结构（全部 section 嵌套，兼容微信内联）：
 * - magazine-cover:
 *   .wemd-magazine-cover
 *     .wemd-mc-title       主标题
 *     .wemd-mc-subtitle    英文副标题
 *     .wemd-mc-divider     装饰线
 *     .wemd-mc-desc        描述文字
 *
 * - section-divider:
 *   .wemd-section-divider
 *     .wemd-sd-part        PART 编号
 *     .wemd-sd-title       章节标题
 *
 * - image-card:
 *   .wemd-image-card
 *     .wemd-ic-image       图片容器
 *     .wemd-ic-caption     图片说明
 *
 * - text-card:
 *   .wemd-text-card
 *     （内部是普通 markdown 内容）
 *
 * - full-quote:
 *   .wemd-full-quote
 *     .wemd-fq-text        引用文字（多段）
 *
 * - two-column-cards:
 *   .wemd-two-column-cards
 *     .wemd-tcc-wrapper    两栏容器
 *       .wemd-tcc-item     每栏卡片
 *         .wemd-tcc-icon   图标
 *         .wemd-tcc-title  标题
 *         .wemd-tcc-desc   描述
 *
 * - end-card:
 *   .wemd-end-card
 *     .wemd-ec-title       主标题
 *     .wemd-ec-subtitle    副标题
 *     .wemd-ec-deco        装饰元素
 */

export const componentStylesMagazine = `/* === magazine-cover 杂志封面卡片 === */
#wemd .wemd-magazine-cover {
  margin: 24px 0;
  padding: 40px 24px;
  background: var(--wemd-bg-card, #ffffff);
  border-radius: 18px;
  text-align: center;
  border: 1px solid var(--wemd-border-soft, #e8ebe8);
  box-sizing: border-box;
}

#wemd .wemd-magazine-cover .wemd-mc-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: var(--wemd-primary, #07c160);
  letter-spacing: 2px;
  line-height: 1.3;
}

#wemd .wemd-magazine-cover .wemd-mc-subtitle {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--wemd-text-soft, #8a8a8a);
  letter-spacing: 1px;
}

#wemd .wemd-magazine-cover .wemd-mc-divider {
  margin: 20px auto;
  width: 60px;
  height: 4px;
  background: var(--wemd-primary, #07c160);
  border-radius: 2px;
}

#wemd .wemd-magazine-cover .wemd-mc-desc {
  margin: 0;
  font-size: 15px;
  line-height: 2;
  color: var(--wemd-text-soft, #666666);
}

/* === section-divider 章节分隔标题 === */
#wemd .wemd-section-divider {
  margin: 40px 0 20px 0;
  text-align: center;
}

#wemd .wemd-section-divider .wemd-sd-part {
  margin: 0;
  font-size: 13px;
  color: var(--wemd-primary, #07c160);
  letter-spacing: 2px;
  font-weight: 500;
}

#wemd .wemd-section-divider .wemd-sd-title {
  margin: 8px 0 0 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--wemd-text-strong, #1a1a1a);
  line-height: 1.4;
}

/* === image-card 图片卡片 === */
#wemd .wemd-image-card {
  margin: 24px 0;
  padding: 8px;
  background: var(--wemd-bg-card, #ffffff);
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

#wemd .wemd-image-card .wemd-ic-image {
  margin: 0;
  padding: 0;
}

#wemd .wemd-image-card .wemd-ic-image img {
  width: 100%;
  display: block;
  border-radius: 10px;
  margin: 0;
  padding: 0;
}

#wemd .wemd-image-card .wemd-ic-caption {
  margin: 8px 4px 2px 4px;
  font-size: 12px;
  color: var(--wemd-text-soft, #999999);
  text-align: center;
  line-height: 1.6;
}

/* === text-card 正文卡片（配合 article-section 全卡片化使用） === */
#wemd .wemd-text-card {
  margin: 16px 0;
  padding: 20px 22px;
  background: var(--wemd-bg-card, #ffffff);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  line-height: 1.8;
  font-size: 15px;
  color: var(--wemd-text-normal, #333333);
}

#wemd .wemd-text-card p {
  margin: 0 0 14px 0;
  line-height: 1.8;
}

#wemd .wemd-text-card p:last-child {
  margin-bottom: 0;
}

/* === full-quote 整行引用卡片 === */
#wemd .wemd-full-quote {
  margin: 28px 0;
  padding: 22px 24px;
  background: var(--wemd-primary, #07c160);
  border-radius: 12px;
  text-align: center;
  box-sizing: border-box;
}

#wemd .wemd-full-quote .wemd-fq-text {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.8;
}

#wemd .wemd-full-quote .wemd-fq-text + .wemd-fq-text {
  margin-top: 8px;
}

/* === two-column-cards 两栏卡片 === */
#wemd .wemd-two-column-cards {
  margin: 24px 0;
}

#wemd .wemd-two-column-cards .wemd-tcc-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

#wemd .wemd-two-column-cards .wemd-tcc-item {
  flex: 1;
  padding: 18px 12px;
  background: var(--wemd-bg-card, #ffffff);
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  font-size: 13px;
  line-height: 1.6;
  color: var(--wemd-text-soft, #888888);
  min-width: 0;
  word-break: break-word;
}

#wemd .wemd-two-column-cards .wemd-tcc-icon {
  margin: 0;
  font-size: 28px;
  line-height: 1;
}

#wemd .wemd-two-column-cards .wemd-tcc-title {
  margin: 8px 0 4px 0;
  font-size: 15px;
  color: var(--wemd-primary, #07c160);
  font-weight: 700;
}

#wemd .wemd-two-column-cards .wemd-tcc-desc {
  margin: 0;
  font-size: 13px;
  color: var(--wemd-text-soft, #888888);
  line-height: 1.6;
}

/* === end-card 结尾致谢卡片 === */
#wemd .wemd-end-card {
  margin: 40px 0 20px 0;
  text-align: center;
}

#wemd .wemd-end-card .wemd-ec-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--wemd-primary, #07c160);
  letter-spacing: 1px;
}

#wemd .wemd-end-card .wemd-ec-subtitle {
  margin: 10px 0 0 0;
  font-size: 13px;
  color: var(--wemd-text-soft, #999999);
  line-height: 1.6;
}

#wemd .wemd-end-card .wemd-ec-deco {
  margin: 12px 0 0 0;
  font-size: 20px;
  opacity: 0.6;
}
`;
