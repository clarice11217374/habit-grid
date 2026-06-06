export function heatmapColor(areaColor: string, count: number) {
  if (count <= 0) return 'var(--grid-empty)';
  const level = Math.min(count, 4);
  return `color-mix(in srgb, ${areaColor} var(--heat-level-${level}), transparent)`;
}

export function heatmapTooltip(date: string, count: number, titles: string[] = []) {
  const summary = `${date}\n${count} ${count === 1 ? 'commit' : 'commits'}`;
  return titles.length > 0 ? `${summary}\n${titles.map(title => `- ${title}`).join('\n')}` : summary;
}
