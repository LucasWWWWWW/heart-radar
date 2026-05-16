// 3D 穿搭模拟器 - Three.js 程序化几何体 + 骨骼分组动画 + 表情系统
// 坐标系:Y 向上,人物站立从 y=0(脚)到 y=4.7(头顶)
// 骨骼分组:armLGroup / armRGroup / legLGroup / legRGroup 各自以肩/髋为锚点,衣袖与裤腿挂在 group 内,跟随旋转

(function () {
  let scene, camera, renderer, avatarGroup, container, clock;
  let initialized = false;
  let isDragging = false;
  let prevX = 0;
  let userRotated = false;

  // 跨 rebuild 保留的 mesh 引用
  const refs = {
    torso: null,
    eyeL: null, eyeR: null,
    mouth: null,
    cheekL: null, cheekR: null,
    armL: null, armR: null,   // Group(以肩为锚点)
    legL: null, legR: null    // Group(以髋为锚点)
  };

  let currentPose = 'idle';
  let currentExpr = 'neutral';
  let lastBlinkAt = -3;
  let nextBlinkInterval = 3;

  function init() {
    if (initialized) return;
    initialized = true;
    container = document.getElementById('canvas-3d');
    if (!container) return;
    const w = 300, h = 500;

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 2.6, 7);
    camera.lookAt(0, 2.4, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 0.7);
    key.position.set(3, 6, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff6a8d, 0.25);
    rim.position.set(-4, 3, -2);
    scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.001;
    scene.add(ground);

    avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    clock = new THREE.Clock();

    const canvas = renderer.domElement;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      userRotated = true;
      prevX = e.clientX;
      canvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      avatarGroup.rotation.y += dx * 0.01;
      prevX = e.clientX;
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
      if (canvas) canvas.style.cursor = 'grab';
    });
    canvas.addEventListener('touchstart', (e) => {
      isDragging = true;
      userRotated = true;
      prevX = e.touches[0].clientX;
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - prevX;
      avatarGroup.rotation.y += dx * 0.01;
      prevX = e.touches[0].clientX;
    }, { passive: true });
    canvas.addEventListener('touchend', () => { isDragging = false; });

    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!isDragging && !userRotated && avatarGroup) {
      avatarGroup.rotation.y += 0.005;
    }
    tickAnimation();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // === 帧动画:呼吸 + 眨眼 + 姿态 ===
  function tickAnimation() {
    if (!clock) return;
    const t = clock.getElapsedTime();

    // 呼吸:躯干 Y 轴轻微缩放
    if (refs.torso) refs.torso.scale.y = 1 + Math.sin(t * 1.4) * 0.014;

    // 眨眼:每隔 nextBlinkInterval 秒触发,持续 0.18s
    const since = t - lastBlinkAt;
    if (since > nextBlinkInterval) {
      const phase = (since - nextBlinkInterval) / 0.18;
      if (phase < 1) {
        const k = phase < 0.5 ? 1 - phase * 1.8 : (phase - 0.5) * 1.8 + 0.1;
        const v = Math.max(0.1, k);
        if (refs.eyeL) refs.eyeL.scale.y = v;
        if (refs.eyeR) refs.eyeR.scale.y = v;
      } else {
        if (refs.eyeL) refs.eyeL.scale.y = 1;
        if (refs.eyeR) refs.eyeR.scale.y = 1;
        lastBlinkAt = t;
        nextBlinkInterval = 2 + Math.random() * 4;
      }
    }

    applyPose(t);
  }

  function applyPose(t) {
    if (!refs.armL || !refs.armR) return;

    // 默认归位
    let resetY = true, resetXRot = true;

    if (currentPose === 'idle') {
      const sw = Math.sin(t * 0.5) * 0.025;
      refs.armL.rotation.set(0, 0, sw);
      refs.armR.rotation.set(0, 0, -sw);
      if (refs.legL) refs.legL.rotation.set(0, 0, 0);
      if (refs.legR) refs.legR.rotation.set(0, 0, 0);
    } else if (currentPose === 'wave') {
      refs.armR.rotation.set(0, 0, -1.55 + Math.sin(t * 5) * 0.15);
      refs.armL.rotation.set(0, 0, Math.sin(t * 0.5) * 0.025);
      if (refs.legL) refs.legL.rotation.set(0, 0, 0);
      if (refs.legR) refs.legR.rotation.set(0, 0, 0);
    } else if (currentPose === 'hips') {
      refs.armL.rotation.set(-0.18, 0, 0.55);
      refs.armR.rotation.set(-0.18, 0, -0.55);
      if (refs.legL) refs.legL.rotation.set(0, 0, 0);
      if (refs.legR) refs.legR.rotation.set(0, 0, 0);
    } else if (currentPose === 'walk') {
      const swing = Math.sin(t * 5) * 0.35;
      if (refs.legL) refs.legL.rotation.set(swing, 0, 0);
      if (refs.legR) refs.legR.rotation.set(-swing, 0, 0);
      refs.armL.rotation.set(-swing * 1.1, 0, 0);
      refs.armR.rotation.set(swing * 1.1, 0, 0);
      avatarGroup.position.y = Math.abs(Math.sin(t * 5)) * 0.05;
      resetY = false;
    }
    if (resetY) avatarGroup.position.y = 0;
    if (resetXRot) avatarGroup.rotation.x = 0;
  }

  function applyExpression() {
    if (!refs.mouth) return;
    const m = refs.mouth;
    const cL = refs.cheekL, cR = refs.cheekR;
    if (currentExpr === 'neutral') {
      m.scale.set(1, 1, 1);
      if (cL) { cL.material.opacity = 0.5; cL.scale.set(1, 0.5, 0.3); }
      if (cR) { cR.material.opacity = 0.5; cR.scale.set(1, 0.5, 0.3); }
    } else if (currentExpr === 'smile') {
      m.scale.set(1.3, 1, 1);
      if (cL) { cL.material.opacity = 0.6; cL.scale.set(1.1, 0.55, 0.3); }
      if (cR) { cR.material.opacity = 0.6; cR.scale.set(1.1, 0.55, 0.3); }
    } else if (currentExpr === 'laugh') {
      m.scale.set(1.6, 1.5, 1);
      if (cL) { cL.material.opacity = 0.75; cL.scale.set(1.3, 0.65, 0.3); }
      if (cR) { cR.material.opacity = 0.75; cR.scale.set(1.3, 0.65, 0.3); }
    } else if (currentExpr === 'shy') {
      m.scale.set(0.65, 0.85, 1);
      if (cL) { cL.material.opacity = 0.9; cL.scale.set(1.5, 0.75, 0.3); }
      if (cR) { cR.material.opacity = 0.9; cR.scale.set(1.5, 0.75, 0.3); }
    }
  }

  function disposeNode(node) {
    node.traverse((n) => {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        if (Array.isArray(n.material)) n.material.forEach((mm) => mm.dispose());
        else n.material.dispose();
      }
    });
  }

  function clearAvatar() {
    if (!avatarGroup) return;
    while (avatarGroup.children.length > 0) {
      const c = avatarGroup.children[0];
      avatarGroup.remove(c);
      disposeNode(c);
    }
    // 复位 refs(group 引用会被重新分配)
    refs.torso = refs.eyeL = refs.eyeR = refs.mouth = null;
    refs.cheekL = refs.cheekR = null;
    refs.armL = refs.armR = refs.legL = refs.legR = null;
  }

  function shade(hex, amt) {
    const c = new THREE.Color(hex);
    if (amt < 0) {
      c.r = Math.max(0, c.r * (1 + amt));
      c.g = Math.max(0, c.g * (1 + amt));
      c.b = Math.max(0, c.b * (1 + amt));
    } else {
      c.r = c.r + (1 - c.r) * amt;
      c.g = c.g + (1 - c.g) * amt;
      c.b = c.b + (1 - c.b) * amt;
    }
    return c;
  }

  function build(state) {
    if (!initialized) init();
    clearAvatar();

    const isF = state.gender === 'female';
    const skinMat = new THREE.MeshStandardMaterial({ color: state.skin, roughness: 0.78 });
    const hairMat = new THREE.MeshStandardMaterial({ color: state.hairColor, roughness: 0.55 });
    const topMat = new THREE.MeshStandardMaterial({ color: state.topColor, roughness: 0.75 });
    const bottomMat = new THREE.MeshStandardMaterial({ color: state.bottomColor, roughness: 0.75 });
    const accMat = new THREE.MeshStandardMaterial({ color: state.accColor, roughness: 0.25, metalness: 0.7 });
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x7a3a3a, roughness: 0.6 });
    const feetMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const cheekMat = new THREE.MeshStandardMaterial({ color: shade(state.skin, -0.15), roughness: 0.7, transparent: true, opacity: 0.5 });

    // ====== 头 ======
    let head;
    if (state.faceShape === 'round') {
      head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 20), skinMat);
    } else if (state.faceShape === 'square') {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.0, 0.85), skinMat);
    } else {
      head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), skinMat);
      head.scale.set(0.88, 1.15, 0.95);
    }
    head.position.y = 4.2;
    avatarGroup.add(head);

    // 眼睛
    const eyeGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const eyeL = new THREE.Mesh(eyeGeo, faceMat);
    eyeL.position.set(-0.16, 4.22, 0.42);
    avatarGroup.add(eyeL);
    refs.eyeL = eyeL;
    const eyeR = new THREE.Mesh(eyeGeo, faceMat);
    eyeR.position.set(0.16, 4.22, 0.42);
    avatarGroup.add(eyeR);
    refs.eyeR = eyeR;

    // 眼高光
    const glintGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const gL = new THREE.Mesh(glintGeo, glintMat);
    gL.position.set(-0.145, 4.235, 0.475);
    avatarGroup.add(gL);
    const gR = new THREE.Mesh(glintGeo, glintMat);
    gR.position.set(0.175, 4.235, 0.475);
    avatarGroup.add(gR);

    // 腮红
    const cheekGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const ckL = new THREE.Mesh(cheekGeo, cheekMat);
    ckL.position.set(-0.28, 4.08, 0.38);
    ckL.scale.set(1, 0.5, 0.3);
    avatarGroup.add(ckL);
    refs.cheekL = ckL;
    const ckR = new THREE.Mesh(cheekGeo, cheekMat);
    ckR.position.set(0.28, 4.08, 0.38);
    ckR.scale.set(1, 0.5, 0.3);
    avatarGroup.add(ckR);
    refs.cheekR = ckR;

    // 嘴
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 8, 16, Math.PI), mouthMat);
    mouth.position.set(0, 4.02, 0.43);
    mouth.rotation.z = Math.PI;
    avatarGroup.add(mouth);
    refs.mouth = mouth;

    // 脖子
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.28, 16), skinMat);
    neck.position.y = 3.6;
    avatarGroup.add(neck);

    // 躯干
    const torsoTop = isF ? 0.5 : 0.62;
    const torsoBot = isF ? 0.42 : 0.55;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(torsoTop, torsoBot, 1.5, 18), skinMat);
    torso.scale.set(1, 1, 0.62);
    torso.position.y = 2.75;
    avatarGroup.add(torso);
    refs.torso = torso;

    // 肩(静态球,不跟手臂动)
    const shoulderX = isF ? 0.6 : 0.7;
    const shoulderGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const shL = new THREE.Mesh(shoulderGeo, skinMat);
    shL.position.set(-shoulderX, 3.4, 0);
    avatarGroup.add(shL);
    const shR = new THREE.Mesh(shoulderGeo, skinMat);
    shR.position.set(shoulderX, 3.4, 0);
    avatarGroup.add(shR);

    // === 手臂(Group,顶端 pivot 在肩部) ===
    const armGeo = new THREE.CylinderGeometry(0.13, 0.13, 1.35, 12);
    armGeo.translate(0, -0.675, 0);
    const handGeo = new THREE.SphereGeometry(0.14, 12, 10);

    const armLGroup = new THREE.Group();
    armLGroup.position.set(-shoulderX, 3.4, 0);
    const armLMesh = new THREE.Mesh(armGeo, skinMat);
    armLGroup.add(armLMesh);
    const handL = new THREE.Mesh(handGeo, skinMat);
    handL.position.set(0, -1.42, 0);
    armLGroup.add(handL);
    avatarGroup.add(armLGroup);
    refs.armL = armLGroup;

    const armRGroup = new THREE.Group();
    armRGroup.position.set(shoulderX, 3.4, 0);
    const armRMesh = new THREE.Mesh(armGeo, skinMat);
    armRGroup.add(armRMesh);
    const handR = new THREE.Mesh(handGeo, skinMat);
    handR.position.set(0, -1.42, 0);
    armRGroup.add(handR);
    avatarGroup.add(armRGroup);
    refs.armR = armRGroup;

    // 腰/臀
    const hipR = isF ? 0.5 : 0.45;
    const hip = new THREE.Mesh(new THREE.CylinderGeometry(hipR, hipR - 0.05, 0.3, 16), skinMat);
    hip.scale.set(1, 1, 0.65);
    hip.position.y = 1.85;
    avatarGroup.add(hip);

    // === 腿(Group,顶端 pivot 在髋部) ===
    const legGeo = new THREE.CylinderGeometry(0.2, 0.18, 1.55, 12);
    legGeo.translate(0, -0.775, 0);
    const footGeo = new THREE.BoxGeometry(0.36, 0.16, 0.55);
    footGeo.translate(0, 0, 0.05);

    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.24, 1.85, 0);
    const legLMesh = new THREE.Mesh(legGeo, skinMat);
    legLGroup.add(legLMesh);
    const footL = new THREE.Mesh(footGeo, feetMat);
    footL.position.set(0, -1.65, 0);
    legLGroup.add(footL);
    avatarGroup.add(legLGroup);
    refs.legL = legLGroup;

    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.24, 1.85, 0);
    const legRMesh = new THREE.Mesh(legGeo, skinMat);
    legRGroup.add(legRMesh);
    const footR = new THREE.Mesh(footGeo, feetMat);
    footR.position.set(0, -1.65, 0);
    legRGroup.add(footR);
    avatarGroup.add(legRGroup);
    refs.legR = legRGroup;

    // ====== 头发 ======
    if (state.hairIdx != null) buildHair(state.hairIdx, hairMat);

    // ====== 上衣(身体部分挂 avatarGroup,衣袖挂 armGroup) ======
    if (state.topIdx != null) buildTop(state.topIdx, topMat);

    // ====== 下装(裤腿挂 legGroup,腰带挂 avatarGroup;裙类挂 avatarGroup 不跟腿) ======
    const topItem = state.topIdx != null && window.DRESSER ? window.DRESSER.TOP_ITEMS[state.topIdx] : null;
    if (state.bottomIdx != null && !(topItem && topItem.coversBottom)) {
      buildBottom(state.bottomIdx, bottomMat);
    }

    // ====== 配饰 ======
    if (state.accIdx != null) buildAcc(state.accIdx, accMat);

    // ====== 身高 + 体型 ======
    const hScale = (state.height || 170) / 170;
    const bScale = state.body || 1.0;
    avatarGroup.scale.set(bScale, hScale, bScale);

    // 应用当前表情(mesh 刚重建)
    applyExpression();

    // 立即 render 一次
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // === 头发 ===
  function buildHair(idx, mat) {
    if (idx === 0) {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.53, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.85), mat);
      h.position.y = 4.2;
      avatarGroup.add(h);
    } else if (idx === 1) {
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.53, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.8), mat);
      top.position.y = 4.2;
      avatarGroup.add(top);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.52, 0.95, 16, 1, true), mat);
      back.position.set(0, 3.78, -0.08);
      back.scale.set(1, 1, 0.85);
      avatarGroup.add(back);
    } else if (idx === 2) {
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.53, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.8), mat);
      top.position.y = 4.2;
      avatarGroup.add(top);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.5, 1.9, 16, 1, true), mat);
      back.position.set(0, 3.35, -0.12);
      back.scale.set(1, 1, 0.55);
      avatarGroup.add(back);
    } else if (idx === 3) {
      const pts = [
        [-0.34, 4.5, 0.05], [-0.05, 4.62, 0.18], [0.22, 4.6, 0.12], [0.42, 4.42, -0.02],
        [-0.42, 4.32, -0.1], [0.46, 4.28, -0.12],
        [-0.32, 4.05, -0.22], [0.32, 4.05, -0.22],
        [0, 4.7, -0.05], [-0.42, 4.18, 0.18], [0.42, 4.18, 0.18]
      ];
      pts.forEach((p) => {
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), mat);
        c.position.set(p[0], p[1], p[2]);
        avatarGroup.add(c);
      });
    } else if (idx === 4) {
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.53, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.85), mat);
      top.position.y = 4.2;
      avatarGroup.add(top);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.23, 18, 14), mat);
      bun.position.y = 4.92;
      avatarGroup.add(bun);
    }
    // idx 5: 光头
  }

  // === 上衣(衣袖挂到 armL/R group 内,本体挂 avatarGroup) ===
  function buildTop(idx, mat) {
    const darkMat = new THREE.MeshStandardMaterial({ color: shade(mat.color.getHex(), -0.18), roughness: 0.75 });
    // 生成 sleeve 函数:位置在 arm group 顶端附近(local y = -0.05),top 对齐肩
    const addSleeves = (sleeveH, sleeveRTop = 0.16, sleeveRBot = 0.15) => {
      const sleeveGeo = new THREE.CylinderGeometry(sleeveRTop, sleeveRBot, sleeveH, 12);
      sleeveGeo.translate(0, -sleeveH / 2, 0);
      const sL = new THREE.Mesh(sleeveGeo, mat);
      sL.position.set(0, -0.05, 0);
      refs.armL.add(sL);
      const sR = new THREE.Mesh(sleeveGeo, mat);
      sR.position.set(0, -0.05, 0);
      refs.armR.add(sR);
    };

    if (idx === 0 || idx === 1 || idx === 4) {
      // T 恤 / 衬衫 / 毛衣
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.5, 1.55, 18), mat);
      body.scale.set(1, 1, 0.64);
      body.position.y = 2.75;
      avatarGroup.add(body);
      addSleeves(idx === 4 ? 1.0 : 0.4);
      if (idx === 1) {
        const collar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.06), darkMat);
        collar.position.set(0, 3.5, 0.32);
        avatarGroup.add(collar);
      }
    } else if (idx === 2) {
      // 卫衣
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.58, 1.65, 18), mat);
      body.scale.set(1, 1, 0.66);
      body.position.y = 2.78;
      avatarGroup.add(body);
      addSleeves(1.1, 0.18, 0.17);
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      hood.position.y = 3.55;
      hood.scale.set(1, 1.2, 1);
      avatarGroup.add(hood);
    } else if (idx === 3) {
      // 西装
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.55, 1.55, 18), mat);
      body.scale.set(1, 1, 0.66);
      body.position.y = 2.75;
      avatarGroup.add(body);
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.06), darkMat);
      lapel.position.set(0, 3.15, 0.39);
      avatarGroup.add(lapel);
      addSleeves(1.2);
    } else if (idx === 5) {
      // 吊带
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.48, 1.2, 16), mat);
      body.scale.set(1, 1, 0.62);
      body.position.y = 2.6;
      avatarGroup.add(body);
      const strapGeo = new THREE.BoxGeometry(0.07, 0.4, 0.05);
      const strL = new THREE.Mesh(strapGeo, mat);
      strL.position.set(-0.22, 3.4, 0.28);
      avatarGroup.add(strL);
      const strR = new THREE.Mesh(strapGeo, mat);
      strR.position.set(0.22, 3.4, 0.28);
      avatarGroup.add(strR);
    } else if (idx === 6) {
      // 连衣裙
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 1.3, 18), mat);
      top.scale.set(1, 1, 0.64);
      top.position.y = 2.85;
      avatarGroup.add(top);
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 18, 1, true), mat);
      skirt.position.y = 1.4;
      avatarGroup.add(skirt);
    } else if (idx === 7) {
      // 风衣
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.7, 2.5, 18), mat);
      body.scale.set(1, 1, 0.64);
      body.position.y = 2.05;
      avatarGroup.add(body);
      addSleeves(1.2, 0.18, 0.18);
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 32), darkMat);
      belt.rotation.x = Math.PI / 2;
      belt.scale.set(1, 0.6, 1);
      belt.position.y = 2.4;
      avatarGroup.add(belt);
    }
  }

  // === 下装 ===
  function buildBottom(idx, mat) {
    // 给一条裤腿(local 坐标,挂到 leg group):top 在 group 原点
    const addPants = (legLen, rTop = 0.22, rBot = 0.22) => {
      const geo = new THREE.CylinderGeometry(rTop, rBot, legLen, 14);
      geo.translate(0, -legLen / 2, 0);
      const lL = new THREE.Mesh(geo, mat);
      lL.position.set(0, 0, 0);
      refs.legL.add(lL);
      const lR = new THREE.Mesh(geo, mat);
      lR.position.set(0, 0, 0);
      refs.legR.add(lR);
    };

    if (idx === 0 || idx === 4 || idx === 5) {
      // 牛仔裤 / 西装裤 / 运动裤
      addPants(1.55);
      const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.22, 16), mat);
      waist.scale.set(1, 1, 0.66);
      waist.position.y = 1.85;
      avatarGroup.add(waist);
      if (idx === 5) {
        // 运动裤侧条(也挂到 leg group,确保跟着摆动)
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const sg = new THREE.BoxGeometry(0.04, 1.45, 0.04);
        sg.translate(0, -0.725, 0);
        const sl = new THREE.Mesh(sg, stripeMat);
        sl.position.set(-0.2, 0, 0);
        refs.legL.add(sl);
        const sr = new THREE.Mesh(sg, stripeMat);
        sr.position.set(0.2, 0, 0);
        refs.legR.add(sr);
      }
    } else if (idx === 1) {
      // 短裤
      addPants(0.55, 0.24, 0.24);
      const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.22, 16), mat);
      waist.scale.set(1, 1, 0.66);
      waist.position.y = 1.85;
      avatarGroup.add(waist);
    } else if (idx === 2) {
      // 短裙(挂 avatarGroup,不跟腿)
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.85, 18, 1, true), mat);
      skirt.position.y = 1.6;
      avatarGroup.add(skirt);
    } else if (idx === 3) {
      // 长裙
      const skirt = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.9, 18, 1, true), mat);
      skirt.position.y = 1.05;
      avatarGroup.add(skirt);
    }
  }

  // === 配饰(挂 avatarGroup,头部静止所以不需要 head group) ===
  function buildAcc(idx, mat) {
    if (idx === 0) {
      const ringGeo = new THREE.TorusGeometry(0.1, 0.022, 8, 24);
      const rL = new THREE.Mesh(ringGeo, mat);
      rL.position.set(-0.16, 4.22, 0.43);
      avatarGroup.add(rL);
      const rR = new THREE.Mesh(ringGeo, mat);
      rR.position.set(0.16, 4.22, 0.43);
      avatarGroup.add(rR);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.025), mat);
      bridge.position.set(0, 4.22, 0.43);
      avatarGroup.add(bridge);
    } else if (idx === 1) {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.4, 18), mat);
      top.position.y = 4.85;
      avatarGroup.add(top);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 28), mat);
      brim.position.y = 4.65;
      avatarGroup.add(brim);
    } else if (idx === 2) {
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 32), mat);
      chain.rotation.x = Math.PI / 2;
      chain.scale.set(1, 1, 0.7);
      chain.position.y = 3.45;
      avatarGroup.add(chain);
      const pendant = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), mat);
      pendant.position.set(0, 3.3, 0.3);
      avatarGroup.add(pendant);
    } else if (idx === 3) {
      const sc = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 12, 32), mat);
      sc.rotation.x = Math.PI / 2;
      sc.position.y = 3.45;
      avatarGroup.add(sc);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.06), mat);
      tail.position.set(0.32, 3.1, 0.25);
      tail.rotation.z = 0.2;
      avatarGroup.add(tail);
    } else if (idx === 4) {
      const earGeo = new THREE.SphereGeometry(0.05, 12, 12);
      const eL = new THREE.Mesh(earGeo, mat);
      eL.position.set(-0.52, 4.05, 0.18);
      avatarGroup.add(eL);
      const eR = new THREE.Mesh(earGeo, mat);
      eR.position.set(0.52, 4.05, 0.18);
      avatarGroup.add(eR);
    } else if (idx === 5) {
      const left = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 8), mat);
      left.position.set(-0.1, 4.65, 0.45);
      left.rotation.z = Math.PI / 2;
      avatarGroup.add(left);
      const right = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.2, 8), mat);
      right.position.set(0.1, 4.65, 0.45);
      right.rotation.z = -Math.PI / 2;
      avatarGroup.add(right);
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat);
      knot.position.set(0, 4.65, 0.45);
      avatarGroup.add(knot);
    }
  }

  function exportPNG() {
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.download = `heart-radar-3d-${ts}.png`;
    link.href = url;
    link.click();
  }

  function resetRotation() {
    if (avatarGroup) {
      avatarGroup.rotation.y = 0;
      userRotated = false;
    }
  }

  function setPose(name) {
    currentPose = name;
    // 立即应用一次,确保即使在没有 RAF 的环境下也能看到姿态变化(headless 测试 / 截图)
    if (clock) applyPose(clock.getElapsedTime());
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
  function setExpression(name) {
    currentExpr = name;
    applyExpression();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }
  function getPose() { return currentPose; }
  function getExpression() { return currentExpr; }

  // 调试入口(查看运行时状态,生产可删)
  function _debug() {
    return {
      initialized,
      clockElapsed: clock ? clock.getElapsedTime() : null,
      avatarRotY: avatarGroup ? avatarGroup.rotation.y : null,
      avatarChildren: avatarGroup ? avatarGroup.children.length : 0,
      armLRotZ: refs.armL ? refs.armL.rotation.z : null,
      armRRotZ: refs.armR ? refs.armR.rotation.z : null,
      legLRotX: refs.legL ? refs.legL.rotation.x : null,
      mouthScaleX: refs.mouth ? refs.mouth.scale.x : null,
      torsoScaleY: refs.torso ? refs.torso.scale.y : null,
      currentPose, currentExpr
    };
  }

  window.DRESSER_3D = {
    init, update: build, exportPNG, resetRotation,
    setPose, setExpression, getPose, getExpression, _debug
  };
})();
