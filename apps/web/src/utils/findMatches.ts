interface Match {
  from: number;
  to: number;
}

const MAX_MATCHES = 10000;

export function findMatches(
  doc: string,
  searchText: string,
  caseSensitive: boolean,
  useRegexp: boolean,
): Match[] {
  const found: Match[] = [];
  try {
    if (useRegexp) {
      const flags = caseSensitive ? "g" : "gi";
      const regex = new RegExp(searchText, flags);
      let m;
      while ((m = regex.exec(doc)) !== null) {
        found.push({ from: m.index, to: m.index + m[0].length });
        if (found.length >= MAX_MATCHES) break;
      }
    } else {
      const searchLower = caseSensitive ? searchText : searchText.toLowerCase();
      const docLower = caseSensitive ? doc : doc.toLowerCase();
      let pos = 0;
      while ((pos = docLower.indexOf(searchLower, pos)) !== -1) {
        found.push({ from: pos, to: pos + searchText.length });
        pos += searchText.length;
        if (found.length >= MAX_MATCHES) break;
      }
    }
  } catch {
    // 正则表达式错误，忽略
  }
  return found;
}
