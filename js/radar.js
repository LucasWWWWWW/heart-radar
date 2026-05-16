// 关系雷达主逻辑

const HISTORY_KEY = 'radar.history.v1';
const HISTORY_MAX = 20;
const API_KEY_STORE = 'radar.apikey.v1';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';

// 当前各维度分值(0–5)
const state = {
  values: window.RADAR_DIMS.map(() => 0)
};

// === 渲染输入滑块 ===
function renderDims() {
  const container = document.getElementById('dim-list');
  container.innerHTML = '';
  window.RADAR_DIMS.forEach((dim, i) => {
    const row = document.createElement('div');
    row.className = 'dim-row';
    row.innerHTML = `
      <div class="dim-head">
        <span class="dim-name">${dim.name}</span>
        <span class="dim-weight">权重 ${dim.weight}</span>
        <span class="dim-value" id="dv-${i}">0</span>
      </div>
      <input type="range" min="0" max="5" step="1" value="0" data-i="${i}">
      <div class="dim-hint">${dim.hint}</div>
    `;
    container.appendChild(row);
    const slider = row.querySelector('input[type="range"]');
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      state.values[i] = v;
      document.getElementById(`dv-${i}`).textContent = v;
      recompute();
    });
  });
}

// === 计算分数 ===
function computeScore() {
  let total = 0;
  window.RADAR_DIMS.forEach((dim, i) => {
    total += (state.values[i] / 5) * dim.weight;
  });
  return Math.round(total);
}

// === 重新渲染所有结果 ===
function recompute() {
  const score = computeScore();
  const stage = window.RADAR_GET_STAGE(score);
  document.getElementById('score-big').textContent = score;
  document.getElementById('stage-badge').textContent = stage.name;
  document.getElementById('stage-summary').textContent = stage.summary;

  // 滑块一旦动,AI 建议失效(基于旧分数生成的)
  const hint = document.getElementById('ai-source');
  if (hint) hint.classList.add('hidden');

  renderBookSuggestions(stage.name);
}

function renderBookSuggestions(stageName) {
  const book = window.RADAR_PLAYBOOK[stageName];
  const sugList = document.getElementById('suggest-list');
  const avoidList = document.getElementById('avoid-list');
  sugList.innerHTML = '';
  avoidList.innerHTML = '';
  book.next.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="action">${escapeHtml(item.action)}</div><div class="reason">${escapeHtml(item.reason)}</div>`;
    sugList.appendChild(li);
  });
  book.avoid.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    avoidList.appendChild(li);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// === 保存历史 ===
function saveSnapshot() {
  const score = computeScore();
  const stage = window.RADAR_GET_STAGE(score);
  const snap = {
    ts: Date.now(),
    dims: state.values.slice(),
    score,
    stage: stage.name
  };
  const history = store.get(HISTORY_KEY, []);
  history.push(snap);
  if (history.length > HISTORY_MAX) history.shift();
  store.set(HISTORY_KEY, history);
  renderHistory();
  // 闪一下按钮提示
  const btn = document.getElementById('save-btn');
  const old = btn.textContent;
  btn.textContent = '✓ 已保存';
  setTimeout(() => { btn.textContent = old; }, 1200);
}

// === 渲染历史折线 ===
function renderHistory() {
  const history = store.get(HISTORY_KEY, []);
  const area = document.getElementById('history-area');
  const clearBtn = document.getElementById('clear-history-btn');

  if (history.length === 0) {
    area.innerHTML = '<div class="history-empty">还没有保存过记录。改完滑块后点"保存这次记录"。</div>';
    clearBtn.style.display = 'none';
    return;
  }
  clearBtn.style.display = '';

  // SVG 折线图(手写,不引图表库)
  const W = 600, H = 120, PAD = 20;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const n = history.length;
  const xStep = n > 1 ? innerW / (n - 1) : 0;

  const points = history.map((h, i) => {
    const x = PAD + i * xStep;
    const y = PAD + innerH - (h.score / 100) * innerH;
    return { x, y, score: h.score, stage: h.stage, ts: h.ts };
  });

  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
  const areaD = pathD + ` L${(PAD + (n - 1) * xStep).toFixed(1)},${(PAD + innerH).toFixed(1)} L${PAD},${(PAD + innerH).toFixed(1)} Z`;

  const ticks = [0, 25, 50, 75, 100].map(v => {
    const y = PAD + innerH - (v / 100) * innerH;
    return `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="2,3"/>
            <text x="${PAD - 4}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--muted)">${v}</text>`;
  }).join('');

  const dots = points.map(p =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="var(--accent)">
       <title>${new Date(p.ts).toLocaleString('zh-CN')}\n分数 ${p.score} · ${p.stage}</title>
     </circle>`
  ).join('');

  const cur = history[history.length - 1];
  const first = history[0];
  const max = Math.max(...history.map(h => h.score));
  const min = Math.min(...history.map(h => h.score));

  area.innerHTML = `
    <svg class="history-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      ${ticks}
      <path d="${areaD}" fill="var(--accent)" opacity="0.12"/>
      <path d="${pathD}" stroke="var(--accent)" stroke-width="2" fill="none"/>
      ${dots}
    </svg>
    <div class="history-stats">
      <div>共 <b>${n}</b> 次</div>
      <div>最高 <b>${max}</b></div>
      <div>最低 <b>${min}</b></div>
      <div>最近 <b>${cur.score}</b> · ${cur.stage}</div>
    </div>
  `;
}

// === 清空历史 ===
function clearHistory() {
  if (!confirm('确定要清空所有历史记录吗?此操作不可撤销。')) return;
  store.del(HISTORY_KEY);
  renderHistory();
}

// === 重置滑块 ===
function resetSliders() {
  state.values = window.RADAR_DIMS.map(() => 0);
  document.querySelectorAll('#dim-list input[type="range"]').forEach((s, i) => {
    s.value = 0;
    document.getElementById(`dv-${i}`).textContent = '0';
  });
  recompute();
}

// === Claude API:个性化建议 ===

function buildPrompt(score, stageName, dims) {
  const dimLines = window.RADAR_DIMS.map((d, i) =>
    `${i + 1}. ${d.name}: ${dims[i]}/5(权重 ${d.weight})`
  ).join('\n');
  return `你是一位健康关系派的恋爱顾问。请基于以下评估给出具体可执行的下一步建议。

用户对一段关系做了 6 维评分(每维 0-5 分):
${dimLines}

加权综合分数: ${score}/100
规则引擎判定的关系阶段: ${stageName}

请输出 JSON,格式如下:
{
  "summary": "对该判定的简短确认或微调(≤40 字)",
  "next": [
    {"action": "具体可执行的动作", "reason": "为什么这么做"},
    {"action": "...", "reason": "..."},
    {"action": "...", "reason": "..."}
  ],
  "avoid": ["第一条避免", "第二条避免"]
}

要求:
- 健康关系派,坦诚 / 节奏 / 共情,**不要** PUA / 推拉 / 战术
- 建议必须具体到场景或动作,不是"加强沟通"这种空话
- 中文,直接 JSON,不要 markdown 代码块
- next 恰好 3 项,avoid 恰好 2 项`;
}

async function callClaude(score, stageName, dims) {
  const apiKey = store.get(API_KEY_STORE, null);
  if (!apiKey) return { needsKey: true };

  const res = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: buildPrompt(score, stageName, dims) }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  // 兜底:剥离可能的 ```json 包裹
  const jsonText = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .trim();
  return JSON.parse(jsonText);
}

async function generateAISuggestions() {
  const btn = document.getElementById('ai-suggest-btn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 生成中...';

  const score = computeScore();
  const stage = window.RADAR_GET_STAGE(score);

  try {
    const result = await callClaude(score, stage.name, state.values);
    if (result.needsKey) {
      openKeyModal();
      return;
    }
    renderAIResult(result);
  } catch (e) {
    console.error('AI 调用失败:', e);
    alert('AI 生成失败:\n' + e.message + '\n\n已保留规则库默认建议。');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function renderAIResult(result) {
  const sugList = document.getElementById('suggest-list');
  const avoidList = document.getElementById('avoid-list');
  const hint = document.getElementById('ai-source');

  sugList.innerHTML = '';
  avoidList.innerHTML = '';

  (result.next || []).forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<div class="action">${escapeHtml(item.action)}</div><div class="reason">${escapeHtml(item.reason)}</div>`;
    sugList.appendChild(li);
  });
  (result.avoid || []).forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    avoidList.appendChild(li);
  });

  hint.innerHTML = `🤖 <b>Claude Haiku 4.5</b> 生成 · <span class="ai-summary">${escapeHtml(result.summary || '')}</span>`;
  hint.classList.remove('hidden');
}

// === API key 模态框 ===

function ensureKeyModal() {
  let overlay = document.getElementById('key-modal');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'key-modal';
  overlay.className = 'modal-overlay hidden';
  overlay.innerHTML = `
    <div class="modal">
      <h3>设置 Claude API key</h3>
      <p class="help">
        key 只存在你浏览器的 localStorage,不会上传到任何第三方。<br>
        用于让 Claude Haiku 4.5 根据 6 维分数生成个性化建议(~$0.001/次)。<br>
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">→ 在 Anthropic Console 申请 key</a>
      </p>
      <input type="password" id="key-input" placeholder="sk-ant-api03-...">
      <div class="modal-actions">
        <button class="btn danger" id="key-clear">清除</button>
        <button class="btn secondary" id="key-cancel">取消</button>
        <button class="btn" id="key-save">保存并使用</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
  document.getElementById('key-cancel').addEventListener('click', () => {
    overlay.classList.add('hidden');
  });
  document.getElementById('key-save').addEventListener('click', () => {
    const v = document.getElementById('key-input').value.trim();
    if (!v) {
      alert('请粘贴你的 API key');
      return;
    }
    store.set(API_KEY_STORE, v);
    overlay.classList.add('hidden');
    generateAISuggestions();
  });
  document.getElementById('key-clear').addEventListener('click', () => {
    if (confirm('确定清除已保存的 API key 吗?下次生成需要重新粘贴。')) {
      store.del(API_KEY_STORE);
      overlay.classList.add('hidden');
    }
  });
  return overlay;
}

function openKeyModal() {
  const overlay = ensureKeyModal();
  const input = document.getElementById('key-input');
  const current = store.get(API_KEY_STORE, null);
  input.value = '';
  if (current) {
    const masked = current.slice(0, 12) + '...' + current.slice(-4);
    input.placeholder = `已保存:${masked}(输入新值替换)`;
    document.getElementById('key-clear').style.display = '';
  } else {
    input.placeholder = 'sk-ant-api03-...';
    document.getElementById('key-clear').style.display = 'none';
  }
  overlay.classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
}

// === 初始化 ===
document.addEventListener('DOMContentLoaded', () => {
  renderDims();
  recompute();
  renderHistory();
  document.getElementById('save-btn').addEventListener('click', saveSnapshot);
  document.getElementById('reset-btn').addEventListener('click', resetSliders);
  document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
  document.getElementById('ai-suggest-btn').addEventListener('click', generateAISuggestions);
  document.getElementById('ai-settings-btn').addEventListener('click', openKeyModal);
});
