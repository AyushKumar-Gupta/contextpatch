export async function addModelExplanation(report) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL;
  if (!baseUrl || !model || report.findings.length === 0) {
    return { ...report, ai: { enabled: false, provider: 'none', note: 'Static analysis is active. Configure Ollama in .env to add an optional local-model explanation.' } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OLLAMA_TIMEOUT_MS || 12000));
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({ model, stream: false, format: 'json', prompt: [
        'You are ContextPatch, an evidence-first assistant for JavaScript/TypeScript developers.',
        'Use only the supplied scan report. Never invent repository facts, filenames, or code.',
        'If evidence is insufficient, say so. Do not write or modify files.',
        'Return JSON with keys: overview (string), nextSteps (array of strings), uncertainty (string).',
        `Scan report: ${JSON.stringify({ repository: report.repository, summary: report.summary, findings: report.findings })}`
      ].join('\n\n') })
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
    const payload = await response.json();
    let explanation;
    try { explanation = JSON.parse(payload.response); } catch { throw new Error('Model response was not valid JSON'); }
    return { ...report, ai: { enabled: true, provider: 'ollama', model, explanation } };
  } catch (error) {
    return { ...report, ai: { enabled: false, provider: 'ollama', model, note: `Local model unavailable; showing static analysis only (${error.name === 'AbortError' ? 'request timed out' : error.message}).` } };
  } finally {
    clearTimeout(timeout);
  }
}
