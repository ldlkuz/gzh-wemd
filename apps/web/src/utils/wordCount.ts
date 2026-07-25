/**
 * 计算 Markdown 文本的纯文本字数（不包含语法字符）
 */
export function countWords(markdown: string): number {
    if (!markdown || markdown.trim() === '') {
        return 0;
    }

    let text = markdown;

    // 移除代码块
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`[^`]+`/g, '');

    // 移除图片
    text = text.replace(/!\[.*?\]\(.*?\)/g, '');

    // 移除链接，保留链接文本
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 移除标题标记
    text = text.replace(/^#{1,6}\s+/gm, '');

    // 移除加粗、斜体、删除线、高亮等格式标记
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');
    text = text.replace(/~~(.*?)~~/g, '$1');
    text = text.replace(/==(.*?)==/g, '$1');

    // 移除引用标记
    text = text.replace(/^>\s+/gm, '');

    // 移除列表标记
    text = text.replace(/^[\s]*[-*+]\s+/gm, '');
    text = text.replace(/^[\s]*\d+\.\s+/gm, '');

    // 移除分割线
    text = text.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '');

    // 移除 HTML 标签
    text = text.replace(/<[^>]+>/g, '');

    // 移除多余空白字符
    text = text.replace(/\s+/g, ' ').trim();

    return text.length;
}

/**
 * 计算行数
 */
export function countLines(markdown: string): number {
    if (!markdown || markdown.trim() === '') {
        return 0;
    }
    return markdown.split('\n').length;
}
