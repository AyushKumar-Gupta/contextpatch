const pathInput = document.querySelector('#repoPath');
const analyzeBtn = document.querySelector('#analyzeBtn');
const statusBox = document.querySelector('#status');
const results = document.querySelector('#results');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function setStatus(message, kind = '') { statusBox.textContent = message; statusBox.className = `status ${kind}`.trim(); }
function renderReport(report) {
  const s = report.summary;
  const metrics = [['Files scanned', s.filesScanned], ['Imports found', s.importsFound], ['Functions found', s.functionsFound], ['Findings', s.findings]];
  const metricsHtml = metrics.map(([label, value]) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`).join('');
  const findingHtml = report.findings.length ? report.findings.map((f) => `<article class="finding"><div class="finding-top"><span class="tag">${escapeHtml(f.severity)} · ${escapeHtml(f.confidence)} confidence</span><span class="mono">${escapeHtml(f.file)}${f.line ? `:${f.line}` : ''}</span></div><h3>${escapeHtml(f.title)}</h3><p><strong>Evidence:</strong> ${escapeHtml(f.evidence)}</p><p><strong>Suggested next step:</strong> ${escapeHtml(f.suggestion)}</p></article>`).join('') : '<div class="empty-box"><strong>No unresolved relative imports found.</strong><p class="hint">That does not prove the project is bug-free. Review syntax warnings and project-specific aliases too.</p></div>';
  const aiHtml = report.ai?.explanation ? `<div class="model-box"><h3>Local model explanation · ${escapeHtml(report.ai.model)}</h3><p>${escapeHtml(report.ai.explanation.overview)}</p><p><strong>Next steps</strong></p><ul>${(report.ai.explanation.nextSteps || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul><p><strong>Uncertainty:</strong> ${escapeHtml(report.ai.explanation.uncertainty)}</p></div>` : `<div class="model-box"><h3>Evidence-first summary</h3><p>${escapeHtml(report.ai?.note || 'Static analysis report generated.')}</p></div>`;
  const errorsHtml = report.parseErrors.length ? `<div class="subhead">FILES THAT COULD NOT BE PARSED (${report.parseErrors.length})</div>${report.parseErrors.slice(0, 30).map((e) => `<article class="finding"><span class="mono">${escapeHtml(e.file)}${e.line ? `:${e.line}` : ''}</span><p>${escapeHtml(e.message)}</p></article>`).join('')}` : '';
  const limitationsHtml = `<div class="subhead">LIMITATIONS TO KEEP IN MIND</div><ul>${report.limitations.map((x) => `<li class="hint">${escapeHtml(x)}</li>`).join('')}</ul>`;
  results.innerHTML = `<div class="result-head"><div><div class="eyebrow">02 / REPORT</div><h2>${escapeHtml(report.repository)}</h2><div class="hint">Scanned ${new Date(report.scannedAt).toLocaleString()}</div></div><span class="local-pill">READ-ONLY ANALYSIS</span></div><div class="metrics">${metricsHtml}</div><div class="subhead">FINDINGS (${report.findings.length})</div>${findingHtml}${aiHtml}${errorsHtml}${limitationsHtml}`;
  results.classList.remove('hidden');
}
async function analyze() {
  const repositoryPath = pathInput.value.trim();
  if (!repositoryPath) { setStatus('Enter the absolute path to a local repository first.', 'error'); pathInput.focus(); return; }
  analyzeBtn.disabled = true; analyzeBtn.textContent = 'Scanning…'; results.classList.add('hidden'); setStatus('Scanning supported source files. Larger repositories may take a moment.');
  try {
    const response = await fetch('/api/repository/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repositoryPath }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Analysis failed.');
    renderReport(payload); setStatus(`Analysis complete: ${payload.summary.filesScanned} source files scanned. No repository files were changed.`, 'success');
  } catch (error) { setStatus(error.message || 'Could not reach the local server. Is npm start running?', 'error'); }
  finally { analyzeBtn.disabled = false; analyzeBtn.innerHTML = 'Analyze repo <span>→</span>'; }
}
analyzeBtn.addEventListener('click', analyze);
pathInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') analyze(); });
