/**
 * WebGL 3D Shooter MVP (visual-upgraded)
 * Enable in game.js with WEBGL_3D_FULLSCREEN_DEMO = true.
 */
function id4(o) {
  o[0] = 1; o[1] = 0; o[2] = 0; o[3] = 0;
  o[4] = 0; o[5] = 1; o[6] = 0; o[7] = 0;
  o[8] = 0; o[9] = 0; o[10] = 1; o[11] = 0;
  o[12] = 0; o[13] = 0; o[14] = 0; o[15] = 1;
  return o;
}

function mul4(o, a, b) {
  var i, j;
  for (i = 0; i < 4; i++) {
    for (j = 0; j < 4; j++) {
      o[i + 4 * j] = a[i] * b[4 * j] + a[i + 4] * b[1 + 4 * j] + a[i + 8] * b[2 + 4 * j] + a[i + 12] * b[3 + 4 * j];
    }
  }
  return o;
}

function persp(o, fovy, aspect, n, f) {
  var s = 1 / Math.tan(fovy / 2);
  o[0] = s / aspect; o[1] = 0; o[2] = 0; o[3] = 0;
  o[4] = 0; o[5] = s; o[6] = 0; o[7] = 0;
  o[8] = 0; o[9] = 0; o[10] = (f + n) / (n - f); o[11] = -1;
  o[12] = 0; o[13] = 0; o[14] = (2 * f * n) / (n - f); o[15] = 0;
  return o;
}

function lookAt(o, ex, ey, ez, cx, cy, cz, ux, uy, uz) {
  var zx = ex - cx, zy = ey - cy, zz = ez - cz;
  var l = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;
  zx /= l; zy /= l; zz /= l;
  var xx = uy * zz - uz * zy;
  var xy = uz * zx - ux * zz;
  var xz = ux * zy - uy * zx;
  l = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1;
  xx /= l; xy /= l; xz /= l;
  var yx = zy * xz - zz * xy;
  var yy = zz * xx - zx * xz;
  var yz = zx * xy - zy * xx;
  o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
  o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
  o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
  o[12] = -(xx * ex + xy * ey + xz * ez);
  o[13] = -(yx * ex + yy * ey + yz * ez);
  o[14] = -(zx * ex + zy * ey + zz * ez);
  o[15] = 1;
  return o;
}

function translate4(o, x, y, z) {
  id4(o);
  o[12] = x; o[13] = y; o[14] = z;
  return o;
}

function rotateX4(o, r) {
  var c = Math.cos(r), s = Math.sin(r);
  o[0] = 1; o[1] = 0; o[2] = 0; o[3] = 0;
  o[4] = 0; o[5] = c; o[6] = s; o[7] = 0;
  o[8] = 0; o[9] = -s; o[10] = c; o[11] = 0;
  o[12] = 0; o[13] = 0; o[14] = 0; o[15] = 1;
  return o;
}

function rotateY4(o, r) {
  var c = Math.cos(r), s = Math.sin(r);
  o[0] = c; o[1] = 0; o[2] = -s; o[3] = 0;
  o[4] = 0; o[5] = 1; o[6] = 0; o[7] = 0;
  o[8] = s; o[9] = 0; o[10] = c; o[11] = 0;
  o[12] = 0; o[13] = 0; o[14] = 0; o[15] = 1;
  return o;
}

function rotateZ4(o, r) {
  var c = Math.cos(r), s = Math.sin(r);
  o[0] = c; o[1] = s; o[2] = 0; o[3] = 0;
  o[4] = -s; o[5] = c; o[6] = 0; o[7] = 0;
  o[8] = 0; o[9] = 0; o[10] = 1; o[11] = 0;
  o[12] = 0; o[13] = 0; o[14] = 0; o[15] = 1;
  return o;
}

function scale4(o, x, y, z) {
  id4(o);
  o[0] = x; o[5] = y; o[10] = z;
  return o;
}

function n3From4(m, n) {
  n[0] = m[0]; n[1] = m[1]; n[2] = m[2];
  n[3] = m[4]; n[4] = m[5]; n[5] = m[6];
  n[6] = m[8]; n[7] = m[9]; n[8] = m[10];
  return n;
}

function pushFace(out, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz) {
  out.push(ax, ay, az, nx, ny, nz, bx, by, bz, nx, ny, nz, cx, cy, cz, nx, ny, nz);
  out.push(ax, ay, az, nx, ny, nz, cx, cy, cz, nx, ny, nz, dx, dy, dz, nx, ny, nz);
}

function box(out, sx, sy, sz) {
  var hx = sx / 2, hy = sy / 2, hz = sz / 2;
  pushFace(out, -hx, -hy, hz, hx, -hy, hz, hx, hy, hz, -hx, hy, hz, 0, 0, 1);
  pushFace(out, -hx, -hy, -hz, -hx, hy, -hz, hx, hy, -hz, hx, -hy, -hz, 0, 0, -1);
  pushFace(out, -hx, hy, -hz, -hx, hy, hz, hx, hy, hz, hx, hy, -hz, 0, 1, 0);
  pushFace(out, -hx, -hy, -hz, hx, -hy, -hz, hx, -hy, hz, -hx, -hy, hz, 0, -1, 0);
  pushFace(out, hx, -hy, -hz, hx, hy, -hz, hx, hy, hz, hx, -hy, hz, 1, 0, 0);
  pushFace(out, -hx, -hy, -hz, -hx, -hy, hz, -hx, hy, hz, -hx, hy, -hz, -1, 0, 0);
}

function compile(gl, type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[3D] shader compile', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createProgram(gl, vs, fs) {
  var p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('[3D] program link', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

var VSH_MESH = [
  'attribute vec3 aPos;',
  'attribute vec3 aNor;',
  'uniform mat4 uMVP;',
  'uniform mat3 uN;',
  'uniform vec3 uLight;',
  'varying vec3 vShade;',
  'void main(){',
  '  vec3 n = normalize(uN * aNor);',
  '  float d = max(dot(n, normalize(-uLight)), 0.2);',
  '  vShade = vec3(0.16 + d * 0.84);',
  '  gl_Position = uMVP * vec4(aPos, 1.0);',
  '}'
].join('');

var FSH_MESH = [
  'precision mediump float;',
  'varying vec3 vShade;',
  'uniform vec3 uRgb;',
  'void main(){',
  '  gl_FragColor = vec4(uRgb * vShade, 1.0);',
  '}'
].join('');

var VSH_STAR = [
  'attribute vec3 aPos;',
  'uniform mat4 uVP;',
  'void main(){',
  '  vec4 p = uVP * vec4(aPos, 1.0);',
  '  gl_Position = p;',
  '  gl_PointSize = clamp(2.0 + (1.0 - p.z) * 1.2, 1.5, 4.0);',
  '}'
].join('');

var FSH_STAR = [
  'precision mediump float;',
  'void main(){',
  '  vec2 c = gl_PointCoord - vec2(0.5);',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  '  float a = smoothstep(0.25, 0.0, d);',
  '  gl_FragColor = vec4(0.75, 0.85, 1.0, a);',
  '}'
].join('');

var VSH_BG = [
  'attribute vec2 aPos;',
  'attribute vec2 aUV;',
  'varying vec2 vUV;',
  'void main(){',
  '  vUV = aUV;',
  '  gl_Position = vec4(aPos, 0.0, 1.0);',
  '}'
].join('');

var FSH_BG = [
  'precision mediump float;',
  'varying vec2 vUV;',
  'uniform sampler2D uTex;',
  'uniform float uMix;',
  'void main(){',
  '  vec3 tex = texture2D(uTex, vUV).rgb;',
  '  vec3 tint = vec3(0.02, 0.04, 0.12);',
  '  gl_FragColor = vec4(mix(tint, tex, uMix), 1.0);',
  '}'
].join('');

function makeBuffer(gl, arr, usage) {
  var b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, arr, usage || gl.STATIC_DRAW);
  return b;
}

function run() {
  var canvas = wx.createCanvas();
  var w = canvas.width;
  var h = canvas.height;
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    wx.showModal({ title: '3D 不可用', content: '当前设备无法创建 WebGL。', showCancel: false });
    return;
  }

  var vsMesh = compile(gl, gl.VERTEX_SHADER, VSH_MESH);
  var fsMesh = compile(gl, gl.FRAGMENT_SHADER, FSH_MESH);
  var pMesh = createProgram(gl, vsMesh, fsMesh);
  gl.deleteShader(vsMesh);
  gl.deleteShader(fsMesh);
  if (!pMesh) return;

  var vsStar = compile(gl, gl.VERTEX_SHADER, VSH_STAR);
  var fsStar = compile(gl, gl.FRAGMENT_SHADER, FSH_STAR);
  var pStar = createProgram(gl, vsStar, fsStar);
  gl.deleteShader(vsStar);
  gl.deleteShader(fsStar);
  if (!pStar) return;

  var vsBg = compile(gl, gl.VERTEX_SHADER, VSH_BG);
  var fsBg = compile(gl, gl.FRAGMENT_SHADER, FSH_BG);
  var pBg = createProgram(gl, vsBg, fsBg);
  gl.deleteShader(vsBg);
  gl.deleteShader(fsBg);
  if (!pBg) return;

  var locMesh = {
    pos: gl.getAttribLocation(pMesh, 'aPos'),
    nor: gl.getAttribLocation(pMesh, 'aNor'),
    mvp: gl.getUniformLocation(pMesh, 'uMVP'),
    n: gl.getUniformLocation(pMesh, 'uN'),
    light: gl.getUniformLocation(pMesh, 'uLight'),
    rgb: gl.getUniformLocation(pMesh, 'uRgb')
  };
  var locStar = {
    pos: gl.getAttribLocation(pStar, 'aPos'),
    vp: gl.getUniformLocation(pStar, 'uVP')
  };
  var locBg = {
    pos: gl.getAttribLocation(pBg, 'aPos'),
    uv: gl.getAttribLocation(pBg, 'aUV'),
    tex: gl.getUniformLocation(pBg, 'uTex'),
    mix: gl.getUniformLocation(pBg, 'uMix')
  };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.015, 0.02, 0.07, 1);

  var cube = [];
  box(cube, 1, 1, 1);
  var bCube = makeBuffer(gl, new Float32Array(cube));
  var nCube = cube.length / 6;

  var floor = [];
  pushFace(floor, -7, -0.02, -12, 7, -0.02, -12, 7, -0.02, 1, -7, -0.02, 1, 0, 1, 0);
  var bFloor = makeBuffer(gl, new Float32Array(floor));
  var nFloor = floor.length / 6;

  var starCount = 160;
  var stars = new Float32Array(starCount * 3);
  var i;
  for (i = 0; i < starCount; i++) {
    stars[i * 3] = (Math.random() * 2 - 1) * 6.5;
    stars[i * 3 + 1] = 0.5 + Math.random() * 4.6;
    stars[i * 3 + 2] = -22 + Math.random() * 24;
  }
  var bStars = makeBuffer(gl, stars, gl.DYNAMIC_DRAW);
  var bgQuad = new Float32Array([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    1, 1, 1, 0
  ]);
  var bBg = makeBuffer(gl, bgQuad, gl.STATIC_DRAW);
  var bgTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, bgTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([5, 8, 20]));
  var bgLoaded = false;
  var bgImage = wx.createImage();
  bgImage.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImage);
    bgLoaded = true;
  };
  bgImage.src = 'assets/background/01.png';

  var proj = new Float32Array(16);
  var view = new Float32Array(16);
  var vp = new Float32Array(16);
  var model = new Float32Array(16);
  var tmp = new Float32Array(16);
  var tmp2 = new Float32Array(16);
  var tmp3 = new Float32Array(16);
  var mvp = new Float32Array(16);
  var n3 = new Float32Array(9);

  var playerX = 0;
  var playerBank = 0;
  var bullets = [];
  var enemies = [];
  var spawnT = 0;
  var fireT = 0;
  var score = 0;
  var needScore = 35;
  var hp = 5;
  // 机身平衡微调（3D 下可稳定调平）
  // roll: 正值右高左低，负值左高右低（建议范围 -5 ~ 5）
  var playerRollTrimDeg = 0.8;
  // 机翼高度差：正值抬右压左，负值抬左压右
  var playerWingBalanceY = 0.012;
  var gameOver = false;
  var gameStarted = false;
  var startAt = Date.now();
  var duration = 50;
  var endedShown = false;

  function spawnEnemy() {
    enemies.push({
      x: (Math.random() * 2 - 1) * 2.75,
      z: -10 - Math.random() * 2.2,
      y: 0.27 + Math.random() * 0.18,
      speed: 2.9 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2
    });
  }

  wx.onTouchMove(function(e) {
    if (!e.touches || !e.touches.length || gameOver) return;
    var x = e.touches[0].clientX || e.touches[0].x || 0;
    var nx = (x / w) * 2 - 1;
    var target = Math.max(-2.9, Math.min(2.9, nx * 3.2));
    playerBank = (target - playerX) * 0.6;
    playerX = target;
  });
  wx.onTouchStart(function(e) {
    if (gameOver || !e.touches || !e.touches.length) return;
    var x = e.touches[0].clientX || e.touches[0].x || 0;
    var nx = (x / w) * 2 - 1;
    playerX = Math.max(-2.9, Math.min(2.9, nx * 3.2));
  });

  function bindMesh(buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(locMesh.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locMesh.nor, 3, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(locMesh.pos);
    gl.enableVertexAttribArray(locMesh.nor);
  }

  function drawMesh(buf, count, color, modelMat) {
    bindMesh(buf);
    mul4(tmp, view, modelMat);
    mul4(mvp, proj, tmp);
    n3From4(modelMat, n3);
    gl.uniformMatrix4fv(locMesh.mvp, false, mvp);
    gl.uniformMatrix3fv(locMesh.n, false, n3);
    gl.uniform3fv(locMesh.light, new Float32Array([0.45, 0.9, 0.35]));
    gl.uniform3fv(locMesh.rgb, color);
    gl.drawArrays(gl.TRIANGLES, 0, count);
  }

  function composePart(base, ox, oy, oz, sx, sy, sz, out) {
    translate4(tmp, ox, oy, oz);
    scale4(tmp2, sx, sy, sz);
    mul4(tmp3, tmp, tmp2);
    mul4(out, base, tmp3);
  }

  function drawPlayer(nowMs) {
    // base transform
    translate4(tmp, playerX, 0.28, 0.05);
    rotateY4(tmp2, playerBank * 0.22 + Math.sin(nowMs * 0.003) * 0.03);
    rotateZ4(tmp3, (playerRollTrimDeg * Math.PI) / 180);
    mul4(model, tmp2, tmp3);
    mul4(model, tmp, model);

    // fuselage
    composePart(model, 0, 0, -0.02, 0.32, 0.17, 0.95, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.82, 0.85, 0.9]), tmp3);
    // nose
    composePart(model, 0, 0.01, -0.56, 0.18, 0.12, 0.36, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.9, 0.92, 0.96]), tmp3);
    // main wings
    composePart(model, 0, -0.01, -0.06, 1.18, 0.05, 0.22, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.72, 0.76, 0.84]), tmp3);
    // 通过两块独立翼片提供左右“调平”能力
    composePart(model, -0.44, -0.01 - playerWingBalanceY, -0.06, 0.34, 0.052, 0.22, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.68, 0.72, 0.8]), tmp3);
    composePart(model, 0.44, -0.01 + playerWingBalanceY, -0.06, 0.34, 0.052, 0.22, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.68, 0.72, 0.8]), tmp3);
    // rear wings
    composePart(model, 0, 0.04, 0.28, 0.58, 0.04, 0.18, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.67, 0.71, 0.8]), tmp3);
    // twin engines
    composePart(model, -0.12, -0.03, 0.38, 0.1, 0.09, 0.28, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.45, 0.5, 0.58]), tmp3);
    composePart(model, 0.12, -0.03, 0.38, 0.1, 0.09, 0.28, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.45, 0.5, 0.58]), tmp3);
    // engine glow
    composePart(model, -0.12, -0.04, 0.56, 0.07, 0.07, 0.08, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.3, 0.75, 1.0]), tmp3);
    composePart(model, 0.12, -0.04, 0.56, 0.07, 0.07, 0.08, tmp3);
    drawMesh(bCube, nCube, new Float32Array([0.3, 0.75, 1.0]), tmp3);
  }

  function endGame(win) {
    if (endedShown) return;
    endedShown = true;
    gameOver = true;
    wx.showModal({
      title: win ? '3D 通关' : '3D 失败',
      content: '得分: ' + score + ' / ' + needScore + (win ? '\n已达到目标分数。' : '\n再试一次！'),
      showCancel: false
    });
  }

  function startGame() {
    score = 0;
    hp = 5;
    bullets = [];
    enemies = [];
    spawnT = 0;
    fireT = 0;
    gameOver = false;
    endedShown = false;
    startAt = Date.now();
    gameStarted = true;
    wx.showToast({ title: '3D开战', icon: 'none', duration: 900 });
  }

  wx.showModal({
    title: '3D首页',
    content: '拖动左右移动战机\n目标分: ' + needScore + '\n点击“开始”进入3D战斗',
    confirmText: '开始',
    showCancel: false,
    success: function() {
      startGame();
    }
  });

  var last = Date.now();
  function frame() {
    var now = Date.now();
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    var left = duration - (now - startAt) / 1000;

    if (gameStarted && !gameOver) {
      spawnT += dt;
      fireT += dt;

      if (spawnT >= 0.5) {
        spawnT = 0;
        spawnEnemy();
      }
      if (fireT >= 0.09) {
        fireT = 0;
        bullets.push({ x: playerX, y: 0.23, z: -0.8 });
        if (bullets.length > 220) bullets.splice(0, bullets.length - 220);
      }

      for (i = bullets.length - 1; i >= 0; i--) {
        bullets[i].z -= 14 * dt;
        if (bullets[i].z < -13) bullets.splice(i, 1);
      }

      for (i = enemies.length - 1; i >= 0; i--) {
        enemies[i].phase += dt * 2.2;
        enemies[i].y += Math.sin(enemies[i].phase) * 0.0016;
        enemies[i].z += enemies[i].speed * dt;
        if (enemies[i].z > 1.0) {
          hp--;
          enemies.splice(i, 1);
          if (hp <= 0) endGame(false);
        }
      }

      for (i = enemies.length - 1; i >= 0; i--) {
        var e = enemies[i];
        var hit = false;
        var j;
        for (j = bullets.length - 1; j >= 0; j--) {
          var b = bullets[j];
          var dx = b.x - e.x;
          var dz = b.z - e.z;
          if (dx * dx + dz * dz < 0.095) {
            bullets.splice(j, 1);
            hit = true;
            break;
          }
        }
        if (hit) {
          enemies.splice(i, 1);
          score++;
        }
      }

      // starfield forward scroll
      for (i = 0; i < starCount; i++) {
        var zi = i * 3 + 2;
        stars[zi] += 5.5 * dt;
        if (stars[zi] > 2) stars[zi] = -22;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, bStars);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, stars);

      playerBank *= 0.92;
      if (score >= needScore) endGame(true);
      if (left <= 0) endGame(score >= needScore);
    }

    persp(proj, Math.PI / 3.6, w / h, 0.1, 100);
    lookAt(view, 0, 5.7, 1.85, 0, 0.25, -6.6, 0, 1, 0);
    mul4(vp, proj, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // background image pass
    gl.useProgram(pBg);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.bindBuffer(gl.ARRAY_BUFFER, bBg);
    gl.vertexAttribPointer(locBg.pos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(locBg.uv, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(locBg.pos);
    gl.enableVertexAttribArray(locBg.uv);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.uniform1i(locBg.tex, 0);
    gl.uniform1f(locBg.mix, bgLoaded ? 0.78 : 0.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // stars (first pass)
    gl.useProgram(pStar);
    gl.disable(gl.CULL_FACE);
    gl.bindBuffer(gl.ARRAY_BUFFER, bStars);
    gl.vertexAttribPointer(locStar.pos, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(locStar.pos);
    gl.uniformMatrix4fv(locStar.vp, false, vp);
    gl.drawArrays(gl.POINTS, 0, starCount);
    gl.enable(gl.CULL_FACE);

    // mesh pass
    gl.useProgram(pMesh);
    id4(model);
    drawMesh(bFloor, nFloor, new Float32Array([0.06, 0.09, 0.16]), model);

    // far planets
    translate4(model, 2.55, 2.6, -10.8);
    scale4(tmp, 1.25, 1.25, 1.25);
    mul4(tmp2, model, tmp);
    drawMesh(bCube, nCube, new Float32Array([0.36, 0.55, 0.9]), tmp2);

    translate4(model, -2.9, 3.1, -9.4);
    scale4(tmp, 0.78, 0.78, 0.78);
    mul4(tmp2, model, tmp);
    drawMesh(bCube, nCube, new Float32Array([0.24, 0.68, 0.92]), tmp2);

    drawPlayer(now);

    for (i = 0; i < bullets.length; i++) {
      translate4(model, bullets[i].x, bullets[i].y, bullets[i].z);
      scale4(tmp, 0.05, 0.05, 0.26);
      mul4(tmp2, model, tmp);
      drawMesh(bCube, nCube, new Float32Array([1.0, 0.84, 0.18]), tmp2);
    }
    for (i = 0; i < enemies.length; i++) {
      rotateY4(tmp, now * 0.0025 + i);
      translate4(tmp2, enemies[i].x, enemies[i].y, enemies[i].z);
      mul4(model, tmp2, tmp);
      scale4(tmp, 0.24, 0.24, 0.24);
      mul4(tmp2, model, tmp);
      drawMesh(bCube, nCube, new Float32Array([0.94, 0.33, 0.3]), tmp2);
    }

    // simple HP bar + home target indicator
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.SCISSOR_TEST);
    var hpRatio = Math.max(0, hp / 5);
    gl.scissor(16, h - 18, Math.floor((w - 32) * hpRatio), 8);
    gl.clearColor(0.29, 0.87, 0.36, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    gl.enable(gl.SCISSOR_TEST);
    var progress = Math.min(1, score / needScore);
    gl.scissor(16, h - 32, Math.floor((w - 32) * progress), 6);
    gl.clearColor(0.95, 0.78, 0.2, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    gl.clearColor(0.015, 0.02, 0.07, 1);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    if ((now % 1000) < 16) {
      console.log('[3D MVP] score=' + score + ' hp=' + hp + ' left=' + Math.max(0, left).toFixed(1));
    }
    requestAnimationFrame(frame);
  }

  console.log('[3D MVP] 启动：拖动屏幕左右移动战机');
  frame();
}

module.exports = { run: run };
