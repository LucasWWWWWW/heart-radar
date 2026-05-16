// 穿搭模拟器 - SVG 素材库(扁平色块 Q 版,纯手写)
// 画布坐标系:300x500,人物正面站立。中心 x=150。
// 关键 Y 坐标:头顶 50 / 脸中 125 / 颈 195 / 肩 215 / 胸 250 / 腰 340 / 臀 380 / 膝 440 / 脚 488

// === 配色 ===
const SKIN_TONES = [
  { name: '冷白', hex: '#f9d5c1' },
  { name: '自然', hex: '#e8b58a' },
  { name: '小麦', hex: '#c98e64' },
  { name: '蜜色', hex: '#a86c46' },
  { name: '巧克力', hex: '#6e442b' }
];

const HAIR_COLORS = [
  { name: '黑色', hex: '#1a1a1a' },
  { name: '深棕', hex: '#4a2c1a' },
  { name: '亚麻金', hex: '#c19a5b' },
  { name: '酒红', hex: '#7d2d2d' },
  { name: '挑染粉', hex: '#d96ba7' }
];

const CLOTH_COLORS = [
  { name: '白', hex: '#f6f6f6' },
  { name: '黑', hex: '#2a2a2a' },
  { name: '正红', hex: '#d63a3a' },
  { name: '海军蓝', hex: '#2a4a7a' },
  { name: '橄榄绿', hex: '#5a6a3a' },
  { name: '粉雾紫', hex: '#c9a3d9' }
];

const ACC_COLORS = [
  { name: '金', hex: '#d4a04a' },
  { name: '银', hex: '#bfbfbf' },
  { name: '黑', hex: '#1a1a1a' }
];

// === 身体底图 ===
// gender: 'female' | 'male'
// faceShape: 'round' | 'square' | 'oval'
// skin: hex
function buildBody(gender, faceShape, skin) {
  const isF = gender === 'female';
  const shoulderL = isF ? 95 : 82;
  const shoulderR = isF ? 205 : 218;
  const hipL = isF ? 90 : 100;
  const hipR = isF ? 210 : 200;

  let head;
  if (faceShape === 'round') {
    head = `<ellipse cx="150" cy="125" rx="55" ry="60" fill="${skin}"/>`;
  } else if (faceShape === 'square') {
    head = `<rect x="93" y="68" width="114" height="120" rx="20" fill="${skin}"/>`;
  } else {
    head = `<ellipse cx="150" cy="128" rx="48" ry="66" fill="${skin}"/>`;
  }

  // 让颜色稍微深一点用于阴影
  const skinShadow = shadeHex(skin, -0.12);

  return `
    ${head}
    <ellipse cx="${shoulderL - 8}" cy="290" rx="14" ry="62" fill="${skin}"/>
    <ellipse cx="${shoulderR + 8}" cy="290" rx="14" ry="62" fill="${skin}"/>
    <rect x="135" y="180" width="30" height="28" fill="${skinShadow}"/>
    <path d="M${shoulderL} 215 Q${shoulderL} 208 ${shoulderL + 8} 206 L${shoulderR - 8} 206 Q${shoulderR} 208 ${shoulderR} 215 L${hipR} 340 Q${hipR} 350 ${hipR - 8} 350 L${hipL + 8} 350 Q${hipL} 350 ${hipL} 340 Z" fill="${skin}"/>
    <path d="M${hipL} 340 L${hipR} 340 L${hipR + 4} 382 L${hipL - 4} 382 Z" fill="${skinShadow}"/>
    <rect x="${hipL + 10}" y="382" width="32" height="103" rx="10" fill="${skin}"/>
    <rect x="${hipR - 42}" y="382" width="32" height="103" rx="10" fill="${skin}"/>
    <ellipse cx="${hipL + 26}" cy="490" rx="20" ry="8" fill="#2a2a2a"/>
    <ellipse cx="${hipR - 26}" cy="490" rx="20" ry="8" fill="#2a2a2a"/>
    <!-- face -->
    <circle cx="135" cy="125" r="3.5" fill="#1a1a1a"/>
    <circle cx="165" cy="125" r="3.5" fill="#1a1a1a"/>
    <circle cx="120" cy="142" r="6" fill="${shadeHex(skin, -0.05)}" opacity="0.5"/>
    <circle cx="180" cy="142" r="6" fill="${shadeHex(skin, -0.05)}" opacity="0.5"/>
    <path d="M140 154 Q150 161 160 154" stroke="#7a3a3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  `;
}

// === 发型 ===
const HAIR_ITEMS = [
  {
    id: 'h1', name: '短发',
    build: (color) => `
      <path d="M95 130 Q90 70 150 60 Q210 70 205 130 L200 110 Q195 95 180 95 L120 95 Q105 95 100 110 Z" fill="${color}"/>
      <path d="M95 130 Q92 105 100 92" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>
    `
  },
  {
    id: 'h2', name: '齐肩',
    build: (color) => `
      <path d="M88 200 Q82 130 95 90 Q120 55 150 55 Q180 55 205 90 Q218 130 212 200 L195 195 L200 130 L150 92 L100 130 L105 195 Z" fill="${color}"/>
      <path d="M150 60 Q148 78 152 92" stroke="${shadeHex(color, -0.2)}" stroke-width="2" fill="none"/>
    `
  },
  {
    id: 'h3', name: '长直发',
    build: (color) => `
      <path d="M85 290 Q72 160 92 100 Q120 50 150 50 Q180 50 208 100 Q228 160 215 290 L198 285 L200 130 L150 88 L100 130 L102 285 Z" fill="${color}"/>
    `
  },
  {
    id: 'h4', name: '卷发',
    build: (color) => `
      <circle cx="105" cy="100" r="20" fill="${color}"/>
      <circle cx="130" cy="78" r="22" fill="${color}"/>
      <circle cx="158" cy="72" r="24" fill="${color}"/>
      <circle cx="188" cy="80" r="22" fill="${color}"/>
      <circle cx="208" cy="105" r="20" fill="${color}"/>
      <circle cx="95" cy="135" r="18" fill="${color}"/>
      <circle cx="215" cy="135" r="18" fill="${color}"/>
      <circle cx="98" cy="165" r="15" fill="${color}"/>
      <circle cx="212" cy="165" r="15" fill="${color}"/>
    `
  },
  {
    id: 'h5', name: '丸子头',
    build: (color) => `
      <circle cx="150" cy="48" r="22" fill="${color}"/>
      <path d="M98 130 Q95 90 130 78 L170 78 Q205 90 202 130 L195 110 Q190 100 175 100 L125 100 Q110 100 105 110 Z" fill="${color}"/>
    `
  },
  {
    id: 'h6', name: '光头',
    build: () => `
      <!-- 空发型,仅露脸 -->
    `
  }
];

// === 上衣 ===
// 上衣覆盖区域:y=205~340(连衣裙覆盖到 y=440)
const TOP_ITEMS = [
  {
    id: 't1', name: 'T 恤',
    build: (color) => `
      <path d="M85 210 Q85 205 95 205 L205 205 Q215 205 215 210 L225 250 L210 255 L210 340 L90 340 L90 255 L75 250 Z" fill="${color}"/>
      <path d="M130 205 Q150 220 170 205" stroke="${shadeHex(color, -0.15)}" stroke-width="2" fill="none"/>
    `
  },
  {
    id: 't2', name: '衬衫',
    build: (color) => `
      <path d="M82 210 Q82 205 92 204 L208 204 Q218 205 218 210 L228 252 L213 257 L213 340 L87 340 L87 257 L72 252 Z" fill="${color}"/>
      <line x1="150" y1="210" x2="150" y2="340" stroke="${shadeHex(color, -0.2)}" stroke-width="1.5"/>
      <circle cx="150" cy="248" r="2" fill="${shadeHex(color, -0.3)}"/>
      <circle cx="150" cy="278" r="2" fill="${shadeHex(color, -0.3)}"/>
      <circle cx="150" cy="308" r="2" fill="${shadeHex(color, -0.3)}"/>
      <path d="M130 205 L150 222 L170 205 L165 215 L150 230 L135 215 Z" fill="${shadeHex(color, -0.1)}"/>
    `
  },
  {
    id: 't3', name: '卫衣',
    build: (color) => `
      <path d="M75 215 Q75 208 88 205 L212 205 Q225 208 225 215 L238 260 L218 268 L218 348 L82 348 L82 268 L62 260 Z" fill="${color}"/>
      <path d="M120 195 Q150 175 180 195 Q175 215 150 218 Q125 215 120 195 Z" fill="${shadeHex(color, -0.1)}"/>
      <ellipse cx="150" cy="300" rx="40" ry="14" fill="${shadeHex(color, -0.15)}" opacity="0.4"/>
    `
  },
  {
    id: 't4', name: '西装',
    build: (color) => `
      <path d="M80 210 Q80 205 90 204 L210 204 Q220 205 220 210 L230 252 L213 258 L213 340 L87 340 L87 258 L70 252 Z" fill="${color}"/>
      <path d="M150 205 L120 240 L130 340 L150 280 L170 340 L180 240 Z" fill="${shadeHex(color, -0.15)}"/>
      <rect x="148" y="240" width="4" height="100" fill="${shadeHex(color, -0.3)}"/>
      <path d="M138 254 L150 268 L162 254" stroke="#ffffff" stroke-width="2" fill="none"/>
    `
  },
  {
    id: 't5', name: '毛衣',
    build: (color) => `
      <path d="M78 215 Q78 208 88 206 L212 206 Q222 208 222 215 L232 258 L215 263 L215 348 L85 348 L85 263 L68 258 Z" fill="${color}"/>
      <path d="M88 230 L212 230" stroke="${shadeHex(color, -0.2)}" stroke-width="1" stroke-dasharray="3,4"/>
      <path d="M88 270 L212 270" stroke="${shadeHex(color, -0.2)}" stroke-width="1" stroke-dasharray="3,4"/>
      <path d="M88 310 L212 310" stroke="${shadeHex(color, -0.2)}" stroke-width="1" stroke-dasharray="3,4"/>
    `
  },
  {
    id: 't6', name: '吊带',
    build: (color) => `
      <rect x="125" y="208" width="8" height="40" fill="${color}"/>
      <rect x="167" y="208" width="8" height="40" fill="${color}"/>
      <path d="M105 240 Q105 235 115 234 L185 234 Q195 235 195 240 L195 340 L105 340 Z" fill="${color}"/>
    `
  },
  {
    id: 't7', name: '连衣裙',
    build: (color) => `
      <path d="M85 210 Q85 205 95 205 L205 205 Q215 205 215 210 L225 250 L210 255 L218 360 L240 440 L60 440 L82 360 L90 255 L75 250 Z" fill="${color}"/>
      <path d="M130 205 Q150 220 170 205" stroke="${shadeHex(color, -0.15)}" stroke-width="2" fill="none"/>
      <path d="M88 360 L212 360" stroke="${shadeHex(color, -0.15)}" stroke-width="1.5"/>
    `,
    coversBottom: true
  },
  {
    id: 't8', name: '风衣',
    build: (color) => `
      <path d="M70 215 Q70 208 82 205 L218 205 Q230 208 230 215 L242 270 L222 278 L222 430 L78 430 L78 278 L58 270 Z" fill="${color}"/>
      <path d="M150 205 L130 220 L130 430 L150 230 L170 430 L170 220 Z" fill="${shadeHex(color, -0.1)}"/>
      <rect x="100" y="320" width="20" height="6" rx="2" fill="${shadeHex(color, -0.3)}"/>
      <rect x="180" y="320" width="20" height="6" rx="2" fill="${shadeHex(color, -0.3)}"/>
    `,
    coversBottom: true
  }
];

// === 下装 ===
// 下装覆盖区域:y=340~485
const BOTTOM_ITEMS = [
  {
    id: 'b1', name: '牛仔裤',
    build: (color) => `
      <path d="M88 340 L212 340 L218 380 L200 485 L160 485 L150 392 L140 485 L100 485 L82 380 Z" fill="${color}"/>
      <line x1="150" y1="346" x2="150" y2="485" stroke="${shadeHex(color, -0.3)}" stroke-width="1.5"/>
      <line x1="100" y1="355" x2="115" y2="355" stroke="${shadeHex(color, -0.3)}" stroke-width="1"/>
    `
  },
  {
    id: 'b2', name: '短裤',
    build: (color) => `
      <path d="M88 340 L212 340 L215 365 L200 415 L160 415 L150 388 L140 415 L100 415 L85 365 Z" fill="${color}"/>
      <line x1="150" y1="346" x2="150" y2="415" stroke="${shadeHex(color, -0.3)}" stroke-width="1.5"/>
    `
  },
  {
    id: 'b3', name: '短裙',
    build: (color) => `
      <path d="M82 340 L218 340 L235 410 L65 410 Z" fill="${color}"/>
      <path d="M82 340 L92 410 M105 340 L113 410 M130 340 L134 410 M150 340 L150 410 M170 340 L166 410 M195 340 L187 410 M218 340 L208 410" stroke="${shadeHex(color, -0.2)}" stroke-width="1" opacity="0.5"/>
    `
  },
  {
    id: 'b4', name: '长裙',
    build: (color) => `
      <path d="M82 340 L218 340 L250 485 L50 485 Z" fill="${color}"/>
      <path d="M82 340 L70 485 M110 340 L100 485 M130 340 L125 485 M150 340 L150 485 M170 340 L175 485 M190 340 L200 485 M218 340 L230 485" stroke="${shadeHex(color, -0.2)}" stroke-width="1" opacity="0.4"/>
    `
  },
  {
    id: 'b5', name: '西装裤',
    build: (color) => `
      <path d="M88 340 L212 340 L210 380 L200 485 L160 485 L150 388 L140 485 L100 485 L90 380 Z" fill="${color}"/>
      <line x1="120" y1="350" x2="130" y2="485" stroke="${shadeHex(color, -0.25)}" stroke-width="1.5"/>
      <line x1="180" y1="350" x2="170" y2="485" stroke="${shadeHex(color, -0.25)}" stroke-width="1.5"/>
    `
  },
  {
    id: 'b6', name: '运动裤',
    build: (color) => `
      <path d="M85 340 L215 340 L222 380 L205 485 L160 485 L150 392 L140 485 L95 485 L78 380 Z" fill="${color}"/>
      <path d="M105 360 L100 480" stroke="#ffffff" stroke-width="3" opacity="0.7"/>
      <path d="M195 360 L200 480" stroke="#ffffff" stroke-width="3" opacity="0.7"/>
    `
  }
];

// === 配饰 ===
const ACC_ITEMS = [
  {
    id: 'a1', name: '眼镜',
    build: (color) => `
      <circle cx="135" cy="125" r="14" fill="none" stroke="${color}" stroke-width="2.5"/>
      <circle cx="165" cy="125" r="14" fill="none" stroke="${color}" stroke-width="2.5"/>
      <line x1="149" y1="125" x2="151" y2="125" stroke="${color}" stroke-width="2.5"/>
    `
  },
  {
    id: 'a2', name: '帽子',
    build: (color) => `
      <ellipse cx="150" cy="78" rx="68" ry="10" fill="${color}"/>
      <path d="M105 78 Q108 38 150 38 Q192 38 195 78 Z" fill="${shadeHex(color, -0.1)}"/>
    `
  },
  {
    id: 'a3', name: '项链',
    build: (color) => `
      <path d="M122 205 Q150 230 178 205" stroke="${color}" stroke-width="2" fill="none"/>
      <circle cx="150" cy="226" r="5" fill="${color}"/>
    `
  },
  {
    id: 'a4', name: '围巾',
    build: (color) => `
      <path d="M115 198 Q115 195 122 194 L178 194 Q185 195 185 198 L188 238 Q170 244 150 244 Q130 244 112 238 Z" fill="${color}"/>
      <path d="M180 236 L195 280 L182 282 L178 240 Z" fill="${shadeHex(color, -0.15)}"/>
    `
  },
  {
    id: 'a5', name: '耳环',
    build: (color) => `
      <circle cx="96" cy="142" r="4" fill="${color}"/>
      <circle cx="204" cy="142" r="4" fill="${color}"/>
    `
  },
  {
    id: 'a6', name: '蝴蝶结',
    build: (color) => `
      <path d="M150 70 L135 80 L135 95 L150 88 L165 95 L165 80 Z" fill="${color}"/>
      <circle cx="150" cy="85" r="3" fill="${shadeHex(color, -0.3)}"/>
    `
  }
];

// === 工具:颜色加深/变浅 ===
function shadeHex(hex, amt) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return hex;
  const rgb = m.map(c => parseInt(c, 16));
  const out = rgb.map(c => {
    const v = Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt));
    return Math.max(0, Math.min(255, v));
  });
  return '#' + out.map(c => c.toString(16).padStart(2, '0')).join('');
}

// === 组合整张 SVG ===
function composeSVG(s) {
  // s: { gender, faceShape, skin, hairIdx, hairColor, topIdx, topColor, bottomIdx, bottomColor, accIdx, accColor, height, body }
  // body: 1.0 / 1.1 / 1.25 — 横向缩放
  // height: 150-195,用于纵向缩放
  const vScale = (s.height || 170) / 170;
  const hScale = s.body || 1.0;

  const body = buildBody(s.gender, s.faceShape, s.skin);
  const hair = s.hairIdx != null ? HAIR_ITEMS[s.hairIdx].build(s.hairColor) : '';
  const top = s.topIdx != null ? TOP_ITEMS[s.topIdx].build(s.topColor) : '';
  const topCoversBottom = s.topIdx != null && TOP_ITEMS[s.topIdx].coversBottom;
  const bottom = (s.bottomIdx != null && !topCoversBottom) ? BOTTOM_ITEMS[s.bottomIdx].build(s.bottomColor) : '';
  const acc = s.accIdx != null ? ACC_ITEMS[s.accIdx].build(s.accColor) : '';

  // Z-order: 身体 → 下装 → 上衣 → 发型 → 配饰
  const innerSVG = `
    <g transform="translate(150 250) scale(${hScale} ${vScale}) translate(-150 -250)">
      ${body}
      ${bottom}
      ${top}
      ${hair}
      ${acc}
    </g>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 500" width="300" height="500">${innerSVG}</svg>`;
}

// === 缩略图(部分用整张 SVG 缩,部分单独裁 viewBox) ===
function makeThumb(category, idx) {
  let inner = '';
  let viewBox = '0 0 300 500';
  const defaultColor = '#bfbfbf';
  if (category === 'hair') {
    inner = HAIR_ITEMS[idx].build(defaultColor);
    viewBox = '60 30 180 200';
  } else if (category === 'top') {
    inner = TOP_ITEMS[idx].build(defaultColor);
    viewBox = '60 195 180 160';
  } else if (category === 'bottom') {
    inner = BOTTOM_ITEMS[idx].build(defaultColor);
    viewBox = '50 330 200 165';
  } else if (category === 'acc') {
    inner = ACC_ITEMS[idx].build(defaultColor);
    viewBox = '70 30 160 230';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`;
}

// === 暴露到全局 ===
window.DRESSER = {
  SKIN_TONES, HAIR_COLORS, CLOTH_COLORS, ACC_COLORS,
  HAIR_ITEMS, TOP_ITEMS, BOTTOM_ITEMS, ACC_ITEMS,
  buildBody, composeSVG, makeThumb, shadeHex
};
