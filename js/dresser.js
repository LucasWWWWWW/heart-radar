// 穿搭模拟器主逻辑

const STATE_KEY = 'dresser.state.v1';

// 当前选择
const state = {
  gender: 'female',
  faceShape: 'round',
  skin: window.DRESSER.SKIN_TONES[1].hex,
  height: 170,
  body: 1.0,
  hairIdx: 1,
  hairColor: window.DRESSER.HAIR_COLORS[0].hex,
  topIdx: 0,
  topColor: window.DRESSER.CLOTH_COLORS[0].hex,
  bottomIdx: 0,
  bottomColor: window.DRESSER.CLOTH_COLORS[3].hex,
  accIdx: null,
  accColor: window.DRESSER.ACC_COLORS[0].hex
};

// 加载已保存的状态
Object.assign(state, store.get(STATE_KEY, {}));

// === 渲染所有控件 ===
function renderControls() {
  // 性别
  renderOptions('ctl-gender', [
    { value: 'female', label: '女' },
    { value: 'male', label: '男' }
  ], state.gender, v => { state.gender = v; redraw(); });

  // 脸型
  renderOptions('ctl-face', [
    { value: 'round', label: '圆脸' },
    { value: 'square', label: '方脸' },
    { value: 'oval', label: '瓜子脸' }
  ], state.faceShape, v => { state.faceShape = v; redraw(); });

  // 肤色
  renderSwatches('ctl-skin', window.DRESSER.SKIN_TONES, state.skin, hex => {
    state.skin = hex; redraw();
  });

  // 身高
  const heightSlider = document.getElementById('ctl-height');
  heightSlider.value = state.height;
  document.getElementById('height-val').textContent = `${state.height} cm`;
  heightSlider.addEventListener('input', e => {
    state.height = parseInt(e.target.value, 10);
    document.getElementById('height-val').textContent = `${state.height} cm`;
    redraw();
  });

  // 体型
  renderOptions('ctl-body', [
    { value: 0.9, label: '偏瘦' },
    { value: 1.0, label: '匀称' },
    { value: 1.15, label: '微胖' },
    { value: 1.3, label: '壮实' }
  ], state.body, v => { state.body = parseFloat(v); redraw(); });

  // 发型缩略图
  renderItemThumbs('ctl-hair', 'hair', window.DRESSER.HAIR_ITEMS, state.hairIdx,
    idx => { state.hairIdx = idx; redraw(); });
  // 发色
  renderSwatches('ctl-hair-color', window.DRESSER.HAIR_COLORS, state.hairColor, hex => {
    state.hairColor = hex; redraw();
  });

  // 上衣
  renderItemThumbs('ctl-top', 'top', window.DRESSER.TOP_ITEMS, state.topIdx,
    idx => { state.topIdx = idx; redraw(); });
  renderSwatches('ctl-top-color', window.DRESSER.CLOTH_COLORS, state.topColor, hex => {
    state.topColor = hex; redraw();
  });

  // 下装
  renderItemThumbs('ctl-bottom', 'bottom', window.DRESSER.BOTTOM_ITEMS, state.bottomIdx,
    idx => { state.bottomIdx = idx; redraw(); });
  renderSwatches('ctl-bottom-color', window.DRESSER.CLOTH_COLORS, state.bottomColor, hex => {
    state.bottomColor = hex; redraw();
  });

  // 配饰(可清空)
  renderItemThumbs('ctl-acc', 'acc', window.DRESSER.ACC_ITEMS, state.accIdx,
    idx => { state.accIdx = idx; redraw(); }, true);
  renderSwatches('ctl-acc-color', window.DRESSER.ACC_COLORS, state.accColor, hex => {
    state.accColor = hex; redraw();
  });
}

function renderOptions(containerId, options, currentValue, onChange) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-pill' + (String(opt.value) === String(currentValue) ? ' sel' : '');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      c.querySelectorAll('.option-pill').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      onChange(opt.value);
    });
    c.appendChild(btn);
  });
}

function renderSwatches(containerId, palette, currentHex, onChange) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  palette.forEach(item => {
    const sw = document.createElement('button');
    sw.className = 'swatch' + (item.hex === currentHex ? ' sel' : '');
    sw.style.background = item.hex;
    sw.title = item.name;
    sw.addEventListener('click', () => {
      c.querySelectorAll('.swatch').forEach(b => b.classList.remove('sel'));
      sw.classList.add('sel');
      onChange(item.hex);
    });
    c.appendChild(sw);
  });
}

function renderItemThumbs(containerId, category, items, currentIdx, onChange, allowEmpty) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';

  // 第一格:不选 / 无
  if (allowEmpty || category === 'acc') {
    const empty = document.createElement('button');
    empty.className = 'item-thumb empty' + (currentIdx == null ? ' sel' : '');
    empty.textContent = '无';
    empty.title = '不选';
    empty.addEventListener('click', () => {
      c.querySelectorAll('.item-thumb').forEach(b => b.classList.remove('sel'));
      empty.classList.add('sel');
      onChange(null);
    });
    c.appendChild(empty);
  }

  items.forEach((item, idx) => {
    const thumb = document.createElement('button');
    thumb.className = 'item-thumb' + (idx === currentIdx ? ' sel' : '');
    thumb.title = item.name;
    thumb.innerHTML = window.DRESSER.makeThumb(category, idx);
    thumb.addEventListener('click', () => {
      c.querySelectorAll('.item-thumb').forEach(b => b.classList.remove('sel'));
      thumb.classList.add('sel');
      onChange(idx);
    });
    c.appendChild(thumb);
  });
}

// === 重绘预览 + 持久化(同步更新 2D 和 3D) ===
function redraw() {
  // 2D SVG
  const svg = window.DRESSER.composeSVG(state);
  const area = document.getElementById('preview-area');
  area.innerHTML = svg;
  const s = area.querySelector('svg');
  if (s) {
    s.setAttribute('width', '300');
    s.setAttribute('height', '500');
  }
  // 3D(只有初始化过才更新,避免在 3D tab 未打开前空跑 WebGL)
  if (window.DRESSER_3D && window.__dresser3DReady__) {
    try { window.DRESSER_3D.update(state); } catch (e) { console.error('3D update err', e); }
  }
  store.set(STATE_KEY, state);
}

// === 导出 PNG ===
function exportPNG() {
  const svg = window.DRESSER.composeSVG(state);
  const canvas = document.getElementById('hidden-canvas');
  const ctx = canvas.getContext('2d');
  // 背景白
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 300, 500);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob2 => {
      const link = document.createElement('a');
      const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      link.download = `heart-radar-outfit-${ts}.png`;
      link.href = URL.createObjectURL(blob2);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, 'image/png');
  };
  img.onerror = () => alert('导出失败,请重试');
  img.src = url;
}

// === 随机搭配 ===
function randomize() {
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  state.skin = rand(window.DRESSER.SKIN_TONES).hex;
  state.hairIdx = Math.floor(Math.random() * window.DRESSER.HAIR_ITEMS.length);
  state.hairColor = rand(window.DRESSER.HAIR_COLORS).hex;
  state.topIdx = Math.floor(Math.random() * window.DRESSER.TOP_ITEMS.length);
  state.topColor = rand(window.DRESSER.CLOTH_COLORS).hex;
  state.bottomIdx = Math.floor(Math.random() * window.DRESSER.BOTTOM_ITEMS.length);
  state.bottomColor = rand(window.DRESSER.CLOTH_COLORS).hex;
  state.accIdx = Math.random() < 0.6 ? Math.floor(Math.random() * window.DRESSER.ACC_ITEMS.length) : null;
  state.accColor = rand(window.DRESSER.ACC_COLORS).hex;
  renderControls();
  redraw();
}

// === Tab 切换(首次进入 3D 时懒初始化 Three.js) ===
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tab}`));
      if (tab === '3d' && window.DRESSER_3D && !window.__dresser3DReady__) {
        window.DRESSER_3D.init();
        window.__dresser3DReady__ = true;
        window.DRESSER_3D.update(state);
      } else if (tab === '3d' && window.__dresser3DReady__) {
        // 切回 3D 时刷一次,免得状态在切换间隙改了
        window.DRESSER_3D.update(state);
      }
    });
  });
}

// === 初始化 ===
document.addEventListener('DOMContentLoaded', () => {
  renderControls();
  redraw();
  bindTabs();
  document.getElementById('export-btn').addEventListener('click', exportPNG);
  document.getElementById('random-btn').addEventListener('click', randomize);
  // 3D 按钮
  const exp3d = document.getElementById('export-3d-btn');
  if (exp3d) exp3d.addEventListener('click', () => window.DRESSER_3D && window.DRESSER_3D.exportPNG());
  const reset3d = document.getElementById('reset-rot-btn');
  if (reset3d) reset3d.addEventListener('click', () => window.DRESSER_3D && window.DRESSER_3D.resetRotation());
  const rand3d = document.getElementById('random-3d-btn');
  if (rand3d) rand3d.addEventListener('click', randomize);
  // 姿态切换
  document.querySelectorAll('#pose-row .option-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pose-row .option-pill').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      if (window.DRESSER_3D) window.DRESSER_3D.setPose(btn.dataset.pose);
    });
  });
  // 表情切换
  document.querySelectorAll('#expr-row .option-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#expr-row .option-pill').forEach(b => b.classList.remove('sel'));
      btn.classList.add('sel');
      if (window.DRESSER_3D) window.DRESSER_3D.setExpression(btn.dataset.expr);
    });
  });
});
