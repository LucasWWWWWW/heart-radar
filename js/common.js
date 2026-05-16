// 共享:主题切换 + localStorage 封装

const THEME_KEY = 'heart-radar.theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
}

function initTheme() {
  let theme = 'dark';
  try { theme = localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) {}
  applyTheme(theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
  updateThemeBtn();
}

function updateThemeBtn() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  btn.textContent = cur === 'dark' ? '☀ 浅色' : '☾ 深色';
}

// localStorage 封装,带 try/catch 防止隐私模式炸掉
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
  del(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

// 简单模态框(用于"AI 真实试衣 coming soon")
function showModal(title, body) {
  let overlay = document.getElementById('cs-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cs-modal';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
      <div class="modal">
        <h3 id="cs-modal-title"></h3>
        <p id="cs-modal-body"></p>
        <div class="modal-actions">
          <button class="btn" onclick="document.getElementById('cs-modal').classList.add('hidden')">知道了</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  }
  document.getElementById('cs-modal-title').textContent = title;
  document.getElementById('cs-modal-body').textContent = body;
  overlay.classList.remove('hidden');
}

// 页面加载时自动初始化主题
initTheme();
document.addEventListener('DOMContentLoaded', () => {
  updateThemeBtn();
  const btn = document.getElementById('theme-btn');
  if (btn) btn.addEventListener('click', toggleTheme);
});
