import { formatTitle } from './utils/formatTitle.js';
import { buildBadge } from './utils/missingBadge.js'; // Intentionally missing for the demo.

export function renderCard(title) {
  return `${formatTitle(title)} ${buildBadge('demo')}`;
}
