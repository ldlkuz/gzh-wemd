/**
 * 内置组件注册入口
 *
 * 功能：注册所有 30 个内置组件到 ComponentRegistry。
 * 每个组件 = manifest.json + 对应 CSS 片段（从 4 个 CSS 文件中引用）。
 *
 * CSS 拼接顺序（必须保持）：
 * default → extra → faq → magazine
 */
import type { ComponentRegistry } from "../registry/ComponentRegistry";
import type { ComponentManifest, ComponentPackage } from "../registry/types";

// === 导入所有 manifest（JSON 文件） ===
import quoteCardManifest from "../builtin/manifests/default/quote-card.json";
import dividerFancyManifest from "../builtin/manifests/default/divider-fancy.json";
import ctaCardManifest from "../builtin/manifests/default/cta-card.json";
import codeFrameManifest from "../builtin/manifests/default/code-frame.json";
import calloutProManifest from "../builtin/manifests/default/callout-pro.json";
import statsBlockManifest from "../builtin/manifests/default/stats-block.json";
import imageGridManifest from "../builtin/manifests/default/image-grid.json";
import authorCardManifest from "../builtin/manifests/default/author-card.json";
import timelineManifest from "../builtin/manifests/default/timeline.json";

import followBarManifest from "../builtin/manifests/extra/follow-bar.json";
import qrCardManifest from "../builtin/manifests/extra/qr-card.json";
import numberedHeadingManifest from "../builtin/manifests/extra/numbered-heading.json";
import sectionTitleManifest from "../builtin/manifests/extra/section-title.json";
import imageTextRowManifest from "../builtin/manifests/extra/image-text-row.json";
import heroBannerManifest from "../builtin/manifests/extra/hero-banner.json";
import shareCardManifest from "../builtin/manifests/extra/share-card.json";
import relatedPostsManifest from "../builtin/manifests/extra/related-posts.json";
import tocNavManifest from "../builtin/manifests/extra/toc-nav.json";
import tagLabelManifest from "../builtin/manifests/extra/tag-label.json";
import imageCaptionManifest from "../builtin/manifests/extra/image-caption.json";
import copyrightNoticeManifest from "../builtin/manifests/extra/copyright-notice.json";
import styledTableManifest from "../builtin/manifests/extra/styled-table.json";

import faqManifest from "../builtin/manifests/faq/faq.json";

import magazineCoverManifest from "../builtin/manifests/magazine/magazine-cover.json";
import sectionDividerManifest from "../builtin/manifests/magazine/section-divider.json";
import imageCardManifest from "../builtin/manifests/magazine/image-card.json";
import textCardManifest from "../builtin/manifests/magazine/text-card.json";
import fullQuoteManifest from "../builtin/manifests/magazine/full-quote.json";
import twoColumnCardsManifest from "../builtin/manifests/magazine/two-column-cards.json";
import endCardManifest from "../builtin/manifests/magazine/end-card.json";

// === 导入 CSS（保持现有 exports 兼容） ===
import {
  componentStylesDefault,
  componentStylesExtra,
  componentStylesFaq,
  componentStylesMagazine,
} from "../../themes";

/**
 * 把现有 4 个 CSS 文件注册到 Registry。
 *
 * 策略：
 * - 每个 CSS 文件作为该文件所属组件的共享 CSS 注册
 * - Phase 2 以后再拆分为每个组件独立的 style.css
 */
export function registerBuiltInComponents(registry: ComponentRegistry): void {
  // default 组（9 个组件共享 componentStylesDefault）
  const defaultManifests: ComponentManifest[] = [
    quoteCardManifest,
    dividerFancyManifest,
    ctaCardManifest,
    codeFrameManifest,
    calloutProManifest,
    statsBlockManifest,
    imageGridManifest,
    authorCardManifest,
    timelineManifest,
  ];
  for (const manifest of defaultManifests) {
    registry.register({
      manifest: manifest as ComponentManifest,
      css: componentStylesDefault,
    });
  }

  // extra 组（13 个组件共享 componentStylesExtra）
  const extraManifests: ComponentManifest[] = [
    followBarManifest,
    qrCardManifest,
    numberedHeadingManifest,
    sectionTitleManifest,
    imageTextRowManifest,
    heroBannerManifest,
    shareCardManifest,
    relatedPostsManifest,
    tocNavManifest,
    tagLabelManifest,
    imageCaptionManifest,
    copyrightNoticeManifest,
    styledTableManifest,
  ];
  for (const manifest of extraManifests) {
    registry.register({
      manifest: manifest as ComponentManifest,
      css: componentStylesExtra,
    });
  }

  // faq 组（1 个组件共享 componentStylesFaq）
  registry.register({
    manifest: faqManifest as ComponentManifest,
    css: componentStylesFaq,
  });

  // magazine 组（7 个组件共享 componentStylesMagazine）
  const magazineManifests: ComponentManifest[] = [
    magazineCoverManifest,
    sectionDividerManifest,
    imageCardManifest,
    textCardManifest,
    fullQuoteManifest,
    twoColumnCardsManifest,
    endCardManifest,
  ];
  for (const manifest of magazineManifests) {
    registry.register({
      manifest: manifest as ComponentManifest,
      css: componentStylesMagazine,
    });
  }
}
