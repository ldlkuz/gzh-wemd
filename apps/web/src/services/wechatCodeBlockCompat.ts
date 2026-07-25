export const materializeCodeLineBreaksForWechat = (
  container: HTMLElement,
): void => {
  container.querySelectorAll<HTMLElement>("pre > code").forEach((code) => {
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }

    textNodes.forEach((textNode) => {
      const text = textNode.data;
      if (!/[\r\n]/.test(text)) return;

      const lines = text.split(/\r\n?|\n/);
      const fragment = document.createDocumentFragment();
      lines.forEach((line, index) => {
        if (index > 0) fragment.appendChild(document.createElement("br"));
        if (line) fragment.appendChild(document.createTextNode(line));
      });
      textNode.replaceWith(fragment);
    });
  });
};
