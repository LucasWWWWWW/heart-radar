# 心动雷达 · 情感与造型助手

一个本地纯静态 Web 应用,包含两个 MVP 功能:

1. **关系雷达** — 输入对方 6 维表现,实时算关心指数 + 阶段判断 + 健康关系派的下一步建议
2. **穿搭模拟器** — 选外貌特征 + 发型/上衣/下装/配饰
   - **2D 简图** — 纯 SVG 实时合成,可导出 PNG
   - **3D 模型** — Three.js 程序化几何体,鼠标拖拽旋转 + 自动旋转,可导出 PNG
   - **AI 真实试衣** — 占位,后续接入

## 跑起来

**方式 1:双击 `start.bat`**(推荐)

会自动打开浏览器到 http://localhost:8000,需要本机有 Python 3。

**方式 2:任意静态服务器**

```powershell
python -m http.server 8000
```

或者直接双击 `index.html` 用 `file://` 打开——所有素材都在本地 JS 里,不走 fetch,所以也能跑。

## 技术栈

- 纯 HTML + Vanilla JS + 手写 CSS
- 零 npm install,零联网,零 API key
- 3D 用 [Three.js r128](https://github.com/mrdoob/three.js) 本地化(`js/lib/three.min.js`,~600KB,MIT 协议)
- `localStorage` 存历史和偏好
- 衣物素材全部手写内嵌 SVG / 程序化几何体,关网刷新也能正常工作

## 目录

```
heart-radar/
├── index.html               # 首页
├── radar.html               # 关系雷达
├── dresser.html             # 穿搭模拟器(2D / 3D / AI 三 tab)
├── styles.css               # 共享样式
├── start.bat                # 双击启动
├── netlify.toml             # 部署配置(可选)
└── js/
    ├── common.js            # 主题、存储封装、模态框
    ├── radar.js             # 雷达逻辑
    ├── radar-rules.js       # 维度与建议数据(健康关系派)
    ├── dresser.js           # 穿搭主逻辑 + 控件 + Tab 切换
    ├── dresser-assets.js    # 2D SVG 素材库
    ├── dresser-3d.js        # 3D 场景与程序化人偶
    └── lib/
        └── three.min.js     # Three.js r128
```

## 隐私

所有数据保存在你的浏览器 `localStorage`,不上传任何服务器。
雷达功能**不存对方姓名/备注**,只存维度分数与时间戳。

## 升级路径(本期未做,文档先留)

### 1. 关系雷达接 AI
- `radar.html` 加"用 AI 重新生成建议"按钮
- 套 Cloudflare Workers 代理 Claude API(参考"乡镇合作社"项目的 Workers 姿势)
- prompt 输入 6 维分数 + 当前阶段,要求输出 JSON 格式的 3 条个性化建议 + 2 条避免

### 2. 真人 AI 试衣(对应 dresser 里的 AI tab)
当前是占位按钮,后续完整方案:

- **用户输入**:
  - 全身照(用户本人,jpg/png)
  - 上衣图(用户从相册选,或从内置库挑)
- **处理流程**:
  1. **本地 NSFW 预检**(浏览器内,**不联网**):用 [nsfwjs](https://github.com/infinitered/nsfwjs)(TensorFlow.js)在前端跑模型,过滤"暴露/性暗示"概率超阈值的图。这是关键保护层,在数据离开浏览器**之前**就拦截。
  2. **上传到 Cloudflare Workers** 中转(隐藏 API key)
  3. **调用试衣模型**:Replicate 上的
     - [IDM-VTON](https://replicate.com/cuuupid/idm-vton) — 真实感强,~$0.05/次
     - [OutfitAnyone](https://github.com/HumanAIGC/OutfitAnyone) — 阿里开源
     - [OOTDiffusion](https://replicate.com/lucataco/ootdiffusion) — 平衡选择
  4. **服务端二次内容检查**:Replicate 默认带 NSFW 过滤;也可以叠加 Hugging Face 的 `Falconsai/nsfw_image_detection` 兜底
  5. **返回合成图**给浏览器,本地展示
- **保护策略**:
  - 拒绝上传明显暴露的原图(前端拦)
  - 拒绝生成暴露内容(后端 / 模型自带)
  - 拒绝未成年人面孔(可接 AWS Rekognition Age Estimation 或类似)
  - 用户每次上传前明确同意 Disclaimer
- **成本控制**:
  - 每用户每天限 N 次,Workers 里做计数
  - 缓存最近 24 小时的结果(同一组合不重算)

### 3. 3D 模型升级路径
当前是程序化几何体(球+圆柱+长方体拼的 Q 版)。后续可升级:
- 加载预制 GLB/VRM 模型(Mixamo CC0 / VRoid Studio 导出)
- 用 three-vrm 实现 anime 风
- 衣物用 PBR 材质 + 法线贴图,质感更真实

### 4. 部署
- `netlify.toml` 已预填,push 到 GitHub 后挂 Netlify 即可
- 接 AI 后,把 Workers 部署到 Cloudflare,前端 fetch 自己的 Workers 域名
