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

/** 列主序 4x4 求逆，用于 NDC 反投影 */
var _matInvScratch = new Float32Array(32);

function invert4x4(out, m) {
  var MINV = _matInvScratch;
  var i, j, k, maxRow;
  var n = 4;
  for (i = 0; i < n; i++) {
    for (j = 0; j < n; j++) MINV[i * 8 + j] = m[i + 4 * j];
    for (j = 0; j < n; j++) MINV[i * 8 + n + j] = i === j ? 1 : 0;
  }
  for (k = 0; k < n; k++) {
    maxRow = k;
    for (i = k + 1; i < n; i++) {
      if (Math.abs(MINV[i * 8 + k]) > Math.abs(MINV[maxRow * 8 + k])) maxRow = i;
    }
    if (Math.abs(MINV[maxRow * 8 + k]) < 1e-14) return false;
    if (maxRow !== k) {
      for (j = 0; j < 2 * n; j++) {
        var t = MINV[k * 8 + j];
        MINV[k * 8 + j] = MINV[maxRow * 8 + j];
        MINV[maxRow * 8 + j] = t;
      }
    }
    var piv = 1 / MINV[k * 8 + k];
    for (j = 0; j < 2 * n; j++) MINV[k * 8 + j] *= piv;
    for (i = 0; i < n; i++) {
      if (i === k) continue;
      var f = MINV[i * 8 + k];
      for (j = 0; j < 2 * n; j++) MINV[i * 8 + j] -= f * MINV[k * 8 + j];
    }
  }
  for (i = 0; i < n; i++) {
    for (j = 0; j < n; j++) out[i + 4 * j] = MINV[i * 8 + n + j];
  }
  return true;
}

function mulMat4Vec4(out, m, x, y, z, w) {
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
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

function sphere(out, radius, latSeg, lonSeg) {
  var y;
  var x;
  for (y = 0; y < latSeg; y++) {
    var v0 = y / latSeg;
    var v1 = (y + 1) / latSeg;
    var t0 = v0 * Math.PI;
    var t1 = v1 * Math.PI;
    var st0 = Math.sin(t0), ct0 = Math.cos(t0);
    var st1 = Math.sin(t1), ct1 = Math.cos(t1);
    for (x = 0; x < lonSeg; x++) {
      var u0 = x / lonSeg;
      var u1 = (x + 1) / lonSeg;
      var p0 = u0 * Math.PI * 2;
      var p1 = u1 * Math.PI * 2;
      var sp0 = Math.sin(p0), cp0 = Math.cos(p0);
      var sp1 = Math.sin(p1), cp1 = Math.cos(p1);
      var ax = cp0 * st0, ay = ct0, az = sp0 * st0;
      var bx = cp0 * st1, by = ct1, bz = sp0 * st1;
      var cx = cp1 * st1, cy = ct1, cz = sp1 * st1;
      var dx = cp1 * st0, dy = ct0, dz = sp1 * st0;
      out.push(ax * radius, ay * radius, az * radius, ax, ay, az);
      out.push(bx * radius, by * radius, bz * radius, bx, by, bz);
      out.push(cx * radius, cy * radius, cz * radius, cx, cy, cz);
      out.push(ax * radius, ay * radius, az * radius, ax, ay, az);
      out.push(cx * radius, cy * radius, cz * radius, cx, cy, cz);
      out.push(dx * radius, dy * radius, dz * radius, dx, dy, dz);
    }
  }
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
  'uniform float uEmit;',
  'uniform vec3 uHot;',
  'uniform float uAddBurst;',
  'void main(){',
  '  if (uAddBurst > 0.001) {',
  '    gl_FragColor = vec4(uHot * uAddBurst, 1.0);',
  '    return;',
  '  }',
  '  vec3 lit = uRgb * vShade;',
  '  vec3 add = uHot * uEmit;',
  '  gl_FragColor = vec4(min(lit + add, vec3(1.0)), 1.0);',
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
  'uniform vec2 uScroll;',
  'void main(){',
  '  vec2 uv = clamp(vUV + uScroll, vec2(0.002), vec2(0.998));',
  '  vec3 tex = texture2D(uTex, uv).rgb;',
  '  tex = clamp((tex - vec3(0.5)) * 1.16 + vec3(0.5), 0.0, 1.0);',
  '  vec3 tint = vec3(0.02, 0.04, 0.12);',
  '  gl_FragColor = vec4(mix(tint, tex, uMix), 1.0);',
  '}'
].join('');

var VSH_HUD = [
  'attribute vec2 aP;',
  'attribute vec4 aC;',
  'varying vec4 vC;',
  'void main(){',
  '  vC = aC;',
  '  gl_Position = vec4(aP, 0.0, 1.0);',
  '}'
].join('');

var FSH_HUD = [
  'precision mediump float;',
  'varying vec4 vC;',
  'void main(){',
  '  gl_FragColor = vC;',
  '}'
].join('');

var VSH_BILLBOARD = [
  'attribute vec2 aLocal;',
  'attribute vec2 aUV;',
  'uniform vec3 uCenter;',
  'uniform vec3 uRight;',
  'uniform vec3 uUp;',
  'uniform float uHalfW;',
  'uniform float uHalfH;',
  'uniform mat4 uMVP;',
  'varying vec2 vUV;',
  'void main(){',
  '  vUV = aUV;',
  '  vec3 pos = uCenter + uRight * (aLocal.x * uHalfW) + uUp * (aLocal.y * uHalfH);',
  '  gl_Position = uMVP * vec4(pos, 1.0);',
  '}'
].join('');

var FSH_BILLBOARD = [
  'precision mediump float;',
  'varying vec2 vUV;',
  'uniform sampler2D uTex;',
  'void main(){',
  '  vec4 c = texture2D(uTex, vUV);',
  '  float a = c.a;',
  '  if (a < 0.02 && dot(c.rgb, c.rgb) < 0.001) discard;',
  '  if (a < 0.02) a = 1.0;',
  '  gl_FragColor = vec4(c.rgb, a);',
  '}'
].join('');

var VSH_UITEX = [
  'attribute vec2 aUV;',
  'uniform vec4 uNdc;',
  'uniform vec4 uUvRect;',
  'uniform vec2 uRot;',
  'varying vec2 vUV;',
  'void main(){',
  '  vUV = mix(uUvRect.xy, uUvRect.zw, aUV);',
  '  vec2 lp = vec2(aUV.x * 2.0 - 1.0, aUV.y * 2.0 - 1.0);',
  '  vec2 rp = vec2(lp.x * uRot.x - lp.y * uRot.y, lp.x * uRot.y + lp.y * uRot.x);',
  '  gl_Position = vec4(uNdc.x + rp.x * uNdc.z, uNdc.y + rp.y * uNdc.w, 0.0, 1.0);',
  '}'
].join('');

var FSH_UITEX = [
  'precision mediump float;',
  'varying vec2 vUV;',
  'uniform sampler2D uTex;',
  'void main(){',
  '  vec4 c = texture2D(uTex, vUV);',
  '  if (c.a < 0.04) discard;',
  '  gl_FragColor = c;',
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
  var windowW = w;
  var windowH = h;
  try {
    var winInfo = wx.getWindowInfo ? wx.getWindowInfo() : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : null);
    if (winInfo) {
      windowW = winInfo.windowWidth || winInfo.screenWidth || w;
      windowH = winInfo.windowHeight || winInfo.screenHeight || h;
    }
  } catch (e) {}
  var PLAYER_Y_MIN = 0.08;
  var PLAYER_Y_MAX = 0.92;
  var PLAYER_Y_DEFAULT = 0.64;
  // 前后移动范围（加大后在当前镜头下更容易感知）
  var PLAYER_Z_NEAR = 1.3;
  var PLAYER_Z_FAR = -3.6;
  // 开局默认后撤到全景位，确保进入战斗无需点击即可看到战机完整轮廓
  var PLAYER_Z_DEFAULT = -2.7;
  // 贴图朝向修正：不同素材坐标系可能相反，可在此翻转
  var PLAYER_VISUAL_FLIP_X = true;
  var PLAYER_VISUAL_FLIP_Y = true;
  // 战机固定滚转矫正（让机身默认垂直朝上）
  // 当前素材在包内朝向接近反向，叠加 180 度后再微调
  var PLAYER_VISUAL_ROLL_FIX_DEG = 144;
  // 贴图层在部分素材下会出现整块残影；默认关闭，仅使用稳定的 3D 机体
  var ENABLE_PLAYER_BILLBOARD = false;
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

  var vsBill = compile(gl, gl.VERTEX_SHADER, VSH_BILLBOARD);
  var fsBill = compile(gl, gl.FRAGMENT_SHADER, FSH_BILLBOARD);
  var pBill = createProgram(gl, vsBill, fsBill);
  gl.deleteShader(vsBill);
  gl.deleteShader(fsBill);
  if (!pBill) return;

  var vsHud = compile(gl, gl.VERTEX_SHADER, VSH_HUD);
  var fsHud = compile(gl, gl.FRAGMENT_SHADER, FSH_HUD);
  var pHud = createProgram(gl, vsHud, fsHud);
  gl.deleteShader(vsHud);
  gl.deleteShader(fsHud);
  if (!pHud) return;

  var vsUiTex = compile(gl, gl.VERTEX_SHADER, VSH_UITEX);
  var fsUiTex = compile(gl, gl.FRAGMENT_SHADER, FSH_UITEX);
  var pUiTex = createProgram(gl, vsUiTex, fsUiTex);
  gl.deleteShader(vsUiTex);
  gl.deleteShader(fsUiTex);
  if (!pUiTex) return;

  var locMesh = {
    pos: gl.getAttribLocation(pMesh, 'aPos'),
    nor: gl.getAttribLocation(pMesh, 'aNor'),
    mvp: gl.getUniformLocation(pMesh, 'uMVP'),
    n: gl.getUniformLocation(pMesh, 'uN'),
    light: gl.getUniformLocation(pMesh, 'uLight'),
    rgb: gl.getUniformLocation(pMesh, 'uRgb'),
    emit: gl.getUniformLocation(pMesh, 'uEmit'),
    hot: gl.getUniformLocation(pMesh, 'uHot'),
    addBurst: gl.getUniformLocation(pMesh, 'uAddBurst')
  };
  var locStar = {
    pos: gl.getAttribLocation(pStar, 'aPos'),
    vp: gl.getUniformLocation(pStar, 'uVP')
  };
  var locBg = {
    pos: gl.getAttribLocation(pBg, 'aPos'),
    uv: gl.getAttribLocation(pBg, 'aUV'),
    tex: gl.getUniformLocation(pBg, 'uTex'),
    mix: gl.getUniformLocation(pBg, 'uMix'),
    scroll: gl.getUniformLocation(pBg, 'uScroll')
  };
  var locBill = {
    local: gl.getAttribLocation(pBill, 'aLocal'),
    uv: gl.getAttribLocation(pBill, 'aUV'),
    center: gl.getUniformLocation(pBill, 'uCenter'),
    right: gl.getUniformLocation(pBill, 'uRight'),
    up: gl.getUniformLocation(pBill, 'uUp'),
    halfW: gl.getUniformLocation(pBill, 'uHalfW'),
    halfH: gl.getUniformLocation(pBill, 'uHalfH'),
    mvp: gl.getUniformLocation(pBill, 'uMVP'),
    tex: gl.getUniformLocation(pBill, 'uTex')
  };
  var locHud = {
    pos: gl.getAttribLocation(pHud, 'aP'),
    col: gl.getAttribLocation(pHud, 'aC')
  };
  var locUiTex = {
    uv: gl.getAttribLocation(pUiTex, 'aUV'),
    tex: gl.getUniformLocation(pUiTex, 'uTex'),
    uvRect: gl.getUniformLocation(pUiTex, 'uUvRect'),
    ndc: gl.getUniformLocation(pUiTex, 'uNdc'),
    rot: gl.getUniformLocation(pUiTex, 'uRot')
  };

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.015, 0.02, 0.07, 1);

  var cube = [];
  box(cube, 1, 1, 1);
  var bCube = makeBuffer(gl, new Float32Array(cube));
  var nCube = cube.length / 6;
  var enemySphere = [];
  sphere(enemySphere, 0.5, 10, 14);
  var bEnemySphere = makeBuffer(gl, new Float32Array(enemySphere));
  var nEnemySphere = enemySphere.length / 6;

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
  var homeBgFiles = ['01.jpg', '02.jpg', '03.jpg'];
  var battleBgFiles = ['01.png', '02.png', '03.png', '04.png'];
  var bgMode = 'home';
  var bgIndex = Math.floor(Math.random() * homeBgFiles.length);
  var bgChangeTimer = 0;
  var bgChangeInterval = 12;

  function packageImagePathVariants(rel) {
    var r = rel.replace(/^\//, '');
    return [r, './' + r, '/' + r];
  }

  function loadImageFromPackage(pathVariants, onLoaded, onFailed) {
    var idx = 0;
    function failAndNext() {
      idx++;
      if (idx >= pathVariants.length) onFailed();
      else attempt();
    }
    function attempt() {
      var path = pathVariants[idx];
      var im = wx.createImage();
      im.onload = function() {
        onLoaded(im, path);
      };
      im.onerror = function() {
        var fs = wx.getFileSystemManager && wx.getFileSystemManager();
        if (!fs || typeof fs.readFile !== 'function') {
          failAndNext();
          return;
        }
        fs.readFile({
          filePath: path,
          encoding: 'base64',
          success: function(res) {
            var lower = path.toLowerCase();
            var mime = lower.indexOf('.jpg') >= 0 || lower.indexOf('jpeg') >= 0 ? 'jpeg' : 'png';
            var dataUrl = 'data:image/' + mime + ';base64,' + res.data;
            var im2 = wx.createImage();
            im2.onload = function() {
              onLoaded(im2, path + ' (fs)');
            };
            im2.onerror = function() {
              failAndNext();
            };
            im2.src = dataUrl;
          },
          fail: function() {
            failAndNext();
          }
        });
      };
      im.src = path;
    }
    attempt();
  }

  function uploadBgFromImage(im, logTag) {
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    bgLoaded = true;
    console.log('[3D] 背景贴图 OK', logTag || '', im.width, im.height);
  }

  function loadBgAtIndex(ix) {
    bgLoaded = false;
    var list = bgMode === 'home' ? homeBgFiles : battleBgFiles;
    var folder = bgMode === 'home' ? 'assets/home/' : 'assets/background/';
    var name = list[ix % list.length];
    var rel = folder + name;
    loadImageFromPackage(
      packageImagePathVariants(rel),
      function(im, tag) {
        uploadBgFromImage(im, tag);
      },
      function() {
        console.error('[3D] 背景资源加载失败，已用纯色底。请确认', rel, '在游戏包内');
        bgLoaded = false;
      }
    );
  }
  loadBgAtIndex(bgIndex);

  var playerTex = gl.createTexture();
  var playerLoaded = false;
  var playerUsesProceduralTex = false;
  var playerImgAspect = 1;
  var playerTexList = [
    'assets/player/player.png',
    'assets/player/fighter.png',
    'assets/player/01.png',
    'assets/player/02.png',
    'assets/player/03.png'
  ];

  function imageLooksLikeFullSceneNotFighter(iw, ih) {
    if (iw < 8 || ih < 8) return true;
    if (Math.min(iw, ih) >= 800) return true;
    if (iw * ih >= 600000) return true;
    return false;
  }

  function uploadProceduralFighterTexture() {
    var PW = 128;
    var PH = 160;
    var px = new Uint8Array(PW * PH * 4);
    var cx = (PW / 2) | 0;
    var y;
    var x;
    for (y = 0; y < PH; y++) {
      for (x = 0; x < PW; x++) {
        var i = (y * PW + x) * 4;
        var nx = (x - cx) / PW;
        var ny = (PH * 0.52 - y) / PH;
        var wings = Math.abs(nx) < 0.4 && ny > -0.06 && ny < 0.14 && Math.abs(nx) > 0.09;
        var body = Math.abs(nx) < 0.095 + ny * 0.22 && ny > -0.26 && ny < 0.4;
        var tail = Math.abs(nx) < 0.17 && ny > -0.52 && ny < -0.1;
        var glow = Math.abs(nx) < 0.06 && ny > 0.36 && ny < 0.48;
        if (glow) {
          px[i] = 50;
          px[i + 1] = 210;
          px[i + 2] = 255;
          px[i + 3] = 255;
        } else if (wings) {
          px[i] = 140;
          px[i + 1] = 165;
          px[i + 2] = 210;
          px[i + 3] = 255;
        } else if (body) {
          px[i] = 228;
          px[i + 1] = 232;
          px[i + 2] = 248;
          px[i + 3] = 255;
        } else if (tail) {
          px[i] = 88;
          px[i + 1] = 108;
          px[i + 2] = 158;
          px[i + 3] = 255;
        } else {
          px[i] = 0;
          px[i + 1] = 0;
          px[i + 2] = 0;
          px[i + 3] = 0;
        }
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, playerTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PW, PH, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    playerImgAspect = PH / PW;
    playerLoaded = true;
    playerUsesProceduralTex = true;
    console.log('[3D] 使用内置战机精灵贴图（请将 assets/player 下大图换成小尺寸 PNG 精灵，建议 ≤360 边长并带透明底）');
  }

  // 无外部精灵时异步加载链较长；先上屏程序贴图，避免开局长时间「看不见战机」
  uploadProceduralFighterTexture();

  function bindPlayerTextureParams() {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function loadPlayerAssetAt(listIndex) {
    if (listIndex >= playerTexList.length) {
      uploadProceduralFighterTexture();
      return;
    }
    var basePath = playerTexList[listIndex];
    // 不在此清空 playerLoaded：否则异步尝试期间 billboard 空白，看起来像「没有战机」
    var finished = false;
    var watchdog = setTimeout(function() {
      if (finished) return;
      finished = true;
      loadPlayerAssetAt(listIndex + 1);
    }, 1200);
    loadImageFromPackage(
      packageImagePathVariants(basePath),
      function(im) {
        if (finished) return;
        finished = true;
        clearTimeout(watchdog);
        var iw = im.width || 1;
        var ih = im.height || 1;
        if (imageLooksLikeFullSceneNotFighter(iw, ih)) {
          console.warn('[3D] 跳过非精灵大图:', basePath, iw, ih);
          loadPlayerAssetAt(listIndex + 1);
          return;
        }
        playerImgAspect = ih / iw;
        gl.bindTexture(gl.TEXTURE_2D, playerTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        bindPlayerTextureParams();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        playerLoaded = true;
        playerUsesProceduralTex = false;
        console.log('[3D] 战机精灵贴图:', basePath, iw, ih);
      },
      function() {
        if (finished) return;
        finished = true;
        clearTimeout(watchdog);
        loadPlayerAssetAt(listIndex + 1);
      }
    );
  }
  loadPlayerAssetAt(0);

  function buildHomeHudVerts() {
    var q = [];
    function quad(ax, ay, bx, by, r, g, b, a) {
      q.push(ax, ay, r, g, b, a, bx, ay, r, g, b, a, ax, by, r, g, b, a);
      q.push(ax, by, r, g, b, a, bx, ay, r, g, b, a, bx, by, r, g, b, a);
    }
    quad(-1, -1, 1, 1, 0.01, 0.02, 0.06, 0.7);
    quad(-0.7, -0.38, 0.7, -0.14, 0.84, 0.64, 0.24, 0.16);
    quad(-0.6, -0.34, 0.6, -0.18, 0.94, 0.27, 0.34, 0.96);
    quad(-0.59, -0.325, 0.59, -0.195, 0.99, 0.68, 0.28, 0.9);
    quad(-0.58, -0.58, 0.58, -0.43, 0.15, 0.3, 0.58, 0.96);
    quad(-0.57, -0.565, 0.57, -0.445, 0.23, 0.42, 0.72, 0.82);
    quad(-0.92, -0.84, 0.92, -0.66, 0.03, 0.06, 0.12, 0.94);
    return new Float32Array(q);
  }
  var homeHudVerts = buildHomeHudVerts();
  var nHomeHudVerts = homeHudVerts.length / 6;
  var bHomeHud = makeBuffer(gl, homeHudVerts);

  var bbQuad = new Float32Array([
    -1, -1, 0, 1,
    1, -1, 1, 1,
    -1, 1, 0, 0,
    1, 1, 1, 0
  ]);
  var bBillboard = makeBuffer(gl, bbQuad, gl.STATIC_DRAW);

  var CAM_EX = 0;
  var CAM_EY = 5.7;
  var CAM_EZ = 1.85;
  var billRight = new Float32Array(3);
  var billUp = new Float32Array(3);

  var proj = new Float32Array(16);
  var view = new Float32Array(16);
  var vp = new Float32Array(16);
  var invVp = new Float32Array(16);
  var rayP0 = new Float32Array(4);
  var rayP1 = new Float32Array(4);
  var bulletSpawnXY = new Float32Array(2);
  var playerNdc = { tx: 0, ty: 0, hh: 0, hw: 0 };
  var BULLET_SPAWN_Z = -0.46;
  var model = new Float32Array(16);
  var tmp = new Float32Array(16);
  var tmp2 = new Float32Array(16);
  var tmp3 = new Float32Array(16);
  var mvp = new Float32Array(16);
  var n3 = new Float32Array(9);
  var LIGHT_DIR = new Float32Array([0.45, 0.9, 0.35]);
  var C_FLOOR = new Float32Array([0.06, 0.09, 0.16]);
  var C_PLANET_A = new Float32Array([0.36, 0.55, 0.9]);
  var C_PLANET_B = new Float32Array([0.24, 0.68, 0.92]);
  var C_SHIP_BODY = new Float32Array([0.94, 0.96, 1.0]);
  var C_SHIP_NOSE = new Float32Array([0.98, 0.99, 1.0]);
  var C_SHIP_WING = new Float32Array([0.86, 0.9, 0.98]);
  var C_SHIP_WING2 = new Float32Array([0.82, 0.88, 0.98]);
  var C_SHIP_REAR = new Float32Array([0.8, 0.86, 0.98]);
  var C_SHIP_ENGINE = new Float32Array([0.55, 0.72, 0.95]);
  var C_SHIP_GLOW = new Float32Array([0.35, 0.88, 1.0]);
  var C_BULLET = new Float32Array([1.0, 0.84, 0.18]);
  var C_BULLET_CORE = new Float32Array([0.92, 0.98, 1.0]);
  var C_BULLET_HOT = new Float32Array([0.22, 0.78, 1.0]);
  var C_BULLET_PWR_CORE = new Float32Array([1.0, 0.92, 0.55]);
  var C_BULLET_PWR_HOT = new Float32Array([1.0, 0.35, 0.95]);
  var C_BULLET_WHITE = new Float32Array([1.0, 1.0, 1.0]);
  var C_MUZZLE_HOT = new Float32Array([0.55, 0.95, 1.0]);
  // Chapter 1 enemy visual set: samurai-style drones (mechanical, non-human)
  var ENEMY_COLORS = [
    new Float32Array([0.86, 0.18, 0.2]),   // crimson armor
    new Float32Array([0.12, 0.12, 0.14]),  // black steel
    new Float32Array([0.86, 0.72, 0.28]),  // dark gold trim
    new Float32Array([0.58, 0.1, 0.14]),   // dark red shadow
    new Float32Array([0.72, 0.72, 0.78])   // metal gray
  ];
  var ENEMY_MASK_COLORS = [
    new Float32Array([0.08, 0.08, 0.1]),
    new Float32Array([0.2, 0.14, 0.08]),
    new Float32Array([0.16, 0.07, 0.09])
  ];
  var ENEMY_EYE_COLORS = [
    new Float32Array([0.98, 0.25, 0.25]),
    new Float32Array([1.0, 0.78, 0.2]),
    new Float32Array([0.92, 0.2, 0.62])
  ];

  var playerX = 0;
  var targetPlayerX = 0;
  var playerY = PLAYER_Y_DEFAULT;
  var playerZ = PLAYER_Z_DEFAULT;
  var targetPlayerZ = PLAYER_Z_DEFAULT;
  var playerBank = 0;
  var bullets = [];
  var muzzleFx = [];
  var enemyBullets = [];
  var enemies = [];
  var spawnT = 0;
  var spawnCount = 0;
  var fireT = 0;
  var tauntCooldown = 0;
  var powerTimer = 0;
  var combo = 0;
  var comboTimer = 0;
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
  var paused = false;
  var enemyTaunts = [
    '侦测：你的火力不足。',
    '武装协议已启动。',
    '锁定完成，准备拦截。',
    '低效攻击，已记录。',
    '战斗演算：你将失败。'
  ];
  var homeBtn = {
    x: w * 0.22,
    y: h * 0.62,
    width: w * 0.56,
    height: Math.max(64, h * 0.08)
  };
  var homeIntroBtn = {
    x: w * 0.22,
    y: h * 0.75,
    width: w * 0.56,
    height: Math.max(56, h * 0.07)
  };
  var homeStartPressedUntil = 0;
  var homeIntroPressedUntil = 0;

  var UI_ATLAS_W = 768;
  var UI_ATLAS_H = 640;
  var uiAtlasTex = gl.createTexture();
  var uiAtlasOk = false;
  var homeStartLabelTex = gl.createTexture();
  var homeIntroLabelTex = gl.createTexture();
  var homeStartLabelOk = false;
  var homeIntroLabelOk = false;
  var uiQuadUV = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
  var bUiQuad = makeBuffer(gl, uiQuadUV);

  function buildPauseBtnHudVerts(wi, hi) {
    var q = [];
    function quad(ax, ay, bx, by, r, g, b, a) {
      q.push(ax, ay, r, g, b, a, bx, ay, r, g, b, a, ax, by, r, g, b, a);
      q.push(ax, by, r, g, b, a, bx, ay, r, g, b, a, bx, by, r, g, b, a);
    }
    var x0 = (wi - 78) / wi * 2 - 1;
    var x1 = (wi - 6) / wi * 2 - 1;
    var yTop = 1 - (10 / hi) * 2;
    var yBot = 1 - (78 / hi) * 2;
    quad(x0, yBot, x1, yTop, 0.1, 0.12, 0.22, 0.82);
    var mx = (x0 + x1) / 2;
    var bw = (5 / wi) * 2;
    var bh = (yTop - yBot) * 0.42;
    var my = (yTop + yBot) / 2;
    quad(mx - bw * 3.2, my - bh / 2, mx - bw * 1.2, my + bh / 2, 0.92, 0.93, 1, 0.96);
    quad(mx + bw * 1.2, my - bh / 2, mx + bw * 3.2, my + bh / 2, 0.92, 0.93, 1, 0.96);
    return new Float32Array(q);
  }
  var pauseBtnHudVerts = buildPauseBtnHudVerts(w, h);
  var nPauseBtnHudVerts = pauseBtnHudVerts.length / 6;
  var bPauseBtnHud = makeBuffer(gl, pauseBtnHudVerts);

  var pauseDimHud = new Float32Array([
    -1, -1, 0, 0, 0, 0.52,
    1, -1, 0, 0, 0, 0.52,
    -1, 1, 0, 0, 0, 0.52,
    -1, 1, 0, 0, 0, 0.52,
    1, -1, 0, 0, 0, 0.52,
    1, 1, 0, 0, 0, 0.52
  ]);
  var bPauseDimHud = makeBuffer(gl, pauseDimHud);
  var nPauseDimVerts = 6;

  function buildUiAtlasTexture() {
    uiAtlasOk = false;
    var oc =
      wx.createOffscreenCanvas &&
      wx.createOffscreenCanvas({ type: '2d', width: UI_ATLAS_W, height: UI_ATLAS_H });
    if (!oc) {
      try {
        var canvasEl = document.createElement('canvas');
        canvasEl.width = UI_ATLAS_W;
        canvasEl.height = UI_ATLAS_H;
        oc = canvasEl;
      } catch (e) {
        console.warn('[3D] 无离屏 Canvas，首页/暂停中文将不可用');
        return;
      }
    }
    var ctx = oc.getContext('2d');
    if (!ctx) {
      console.warn('[3D] 离屏 Canvas 无 2D 上下文');
      return;
    }
    ctx.clearRect(0, 0, UI_ATLAS_W, UI_ATLAS_H);
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(255,180,110,0.28)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(12,18,28,0.9)';
    ctx.fillStyle = 'rgba(242,246,255,0.98)';
    ctx.font = 'bold 46px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.strokeText('3D 随机闯关', 40, 28);
    ctx.fillText('3D 随机闯关', 40, 28);
    ctx.font = '30px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = 'rgba(212,222,244,0.9)';
    ctx.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = 'rgba(184,196,224,0.88)';

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 312);
    ctx.lineTo(UI_ATLAS_W - 24, 312);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,220,170,0.98)';
    ctx.font = 'bold 38px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.strokeText('游戏已暂停', 40, 338);
    ctx.fillText('游戏已暂停', 40, 338);
    ctx.fillStyle = 'rgba(218,226,248,0.94)';
    ctx.font = '30px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.strokeText('轻触屏幕任意处继续', 40, 398);
    ctx.fillText('轻触屏幕任意处继续', 40, 398);

    gl.bindTexture(gl.TEXTURE_2D, uiAtlasTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    uiAtlasOk = true;
  }

  function buildHomeLabelTexture(tex, text, textColor, wPx, hPx, fontPx) {
    var oc =
      wx.createOffscreenCanvas &&
      wx.createOffscreenCanvas({ type: '2d', width: wPx, height: hPx });
    if (!oc) {
      try {
        var canvasEl = document.createElement('canvas');
        canvasEl.width = wPx;
        canvasEl.height = hPx;
        oc = canvasEl;
      } catch (e) {
        return false;
      }
    }
    var ctx = oc.getContext('2d');
    if (!ctx) return false;
    ctx.clearRect(0, 0, wPx, hPx);
    // rounded dark plate to improve readability
    var r = Math.min(hPx * 0.36, 30);
    var x = 8, y = 8, rw = wPx - 16, rh = hPx - 16;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + rw - r, y);
    ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
    ctx.lineTo(x + rw, y + rh - r);
    ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
    ctx.lineTo(x + r, y + rh);
    ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(4,10,20,0.22)';
    ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(10,16,28,0.9)';
    ctx.font = 'bold ' + fontPx + 'px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = textColor;
    ctx.strokeText(text, wPx * 0.5, hPx * 0.52);
    ctx.fillText(text, wPx * 0.5, hPx * 0.52);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    return true;
  }

  function buildHomeButtonLabelTextures() {
    homeStartLabelOk = buildHomeLabelTexture(homeStartLabelTex, '开始游戏', 'rgba(232,246,235,0.99)', 512, 128, 64);
    homeIntroLabelOk = buildHomeLabelTexture(homeIntroLabelTex, '游戏介绍', 'rgba(228,238,255,0.99)', 512, 112, 56);
  }

  function drawUiTexRegion(uvMinU, uvMinV, uvMaxU, uvMaxV, cx, cy, hw, hh) {
    if (!uiAtlasOk) return;
    if (locHud.pos >= 0) gl.disableVertexAttribArray(locHud.pos);
    if (locHud.col >= 0) gl.disableVertexAttribArray(locHud.col);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pUiTex);
    gl.bindBuffer(gl.ARRAY_BUFFER, bUiQuad);
    gl.vertexAttribPointer(locUiTex.uv, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(locUiTex.uv);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, uiAtlasTex);
    gl.uniform1i(locUiTex.tex, 0);
    gl.uniform4f(locUiTex.uvRect, uvMinU, uvMinV, uvMaxU, uvMaxV);
    gl.uniform4f(locUiTex.ndc, cx, cy, hw, hh);
    gl.uniform2f(locUiTex.rot, 1, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (locUiTex.uv >= 0) gl.disableVertexAttribArray(locUiTex.uv);
  }

  function drawUiTexture(tex, cx, cy, hw, hh, rollRad) {
    var rr = rollRad || 0;
    if (locHud.pos >= 0) gl.disableVertexAttribArray(locHud.pos);
    if (locHud.col >= 0) gl.disableVertexAttribArray(locHud.col);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pUiTex);
    gl.bindBuffer(gl.ARRAY_BUFFER, bUiQuad);
    gl.vertexAttribPointer(locUiTex.uv, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(locUiTex.uv);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(locUiTex.tex, 0);
    gl.uniform4f(locUiTex.uvRect, 0, 0, 1, 1);
    gl.uniform4f(locUiTex.ndc, cx, cy, hw, hh);
    gl.uniform2f(locUiTex.rot, Math.cos(rr), Math.sin(rr));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (locUiTex.uv >= 0) gl.disableVertexAttribArray(locUiTex.uv);
  }

  function computePlayerSpriteNdc(out) {
    var zSpan = Math.max(0.08, PLAYER_Z_NEAR - PLAYER_Z_FAR);
    var z01 = Math.max(0, Math.min(1, (playerZ - PLAYER_Z_FAR) / zSpan));
    var sc = 0.75 + z01 * 0.6;
    out.hw = 0.2 * sc;
    var asp = playerImgAspect > 0 ? playerImgAspect : 1.25;
    out.hh = Math.min(0.36, out.hw * Math.min(2.2, Math.max(0.55, asp)));
    // 叠层战机保持在可视中下区域，避免落到底边形成残影错觉
    out.ty = -0.56 + z01 * 0.34;
    out.tx = (playerX / 3.2) * (0.48 + z01 * 0.16);
    out.ty = Math.max(out.hh - 0.97, Math.min(-0.18, out.ty));
    out.tx = Math.max(out.hw - 0.97, Math.min(0.97 - out.hw, out.tx));
  }

  function worldFromNdcOnPlane(outXY, vpMat, ndcX, ndcY, planeZ) {
    if (!invert4x4(invVp, vpMat)) return false;
    mulMat4Vec4(rayP0, invVp, ndcX, ndcY, -1, 1);
    var w0 = rayP0[3];
    if (Math.abs(w0) < 1e-8) return false;
    var ax = rayP0[0] / w0;
    var ay = rayP0[1] / w0;
    var az = rayP0[2] / w0;
    mulMat4Vec4(rayP1, invVp, ndcX, ndcY, 1, 1);
    var w1 = rayP1[3];
    if (Math.abs(w1) < 1e-8) return false;
    var bx = rayP1[0] / w1;
    var by = rayP1[1] / w1;
    var bz = rayP1[2] / w1;
    var dz = bz - az;
    if (Math.abs(dz) < 1e-8) return false;
    var t = (planeZ - az) / dz;
    if (t < -5 || t > 120) return false;
    outXY[0] = ax + t * (bx - ax);
    outXY[1] = ay + t * (by - ay);
    return true;
  }

  function worldFromSpriteMuzzleOnPlane(outXY, vpMat, planeZ) {
    computePlayerSpriteNdc(playerNdc);
    return worldFromNdcOnPlane(outXY, vpMat, playerNdc.tx, playerNdc.ty + playerNdc.hh * 0.4, planeZ);
  }

  // 仅战斗内：屏幕空间绘制战机（与 3D 逻辑解耦），首页不调用
  function drawPlayerScreenOverlay() {
    if (!playerLoaded) return;
    computePlayerSpriteNdc(playerNdc);
    var drawHw = PLAYER_VISUAL_FLIP_X ? -playerNdc.hw : playerNdc.hw;
    var drawHh = PLAYER_VISUAL_FLIP_Y ? -playerNdc.hh : playerNdc.hh;
    var rollFix = (PLAYER_VISUAL_ROLL_FIX_DEG * Math.PI) / 180;
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    drawUiTexture(playerTex, playerNdc.tx, playerNdc.ty, drawHw, drawHh, rollFix);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(pMesh);
  }

  buildUiAtlasTexture();
  buildHomeButtonLabelTextures();

  function spawnEnemy() {
    var progress = gameStarted ? Math.min(1, score / needScore) : 0;
    var hasTaunt = Math.random() < 0.34;
    spawnCount++;
    var isElite = spawnCount % 8 === 0;
    var enemyRadius = (isElite ? 0.56 : 0.42) + Math.random() * (isElite ? 0.08 : 0.06);
    var hpBase = isElite ? 4 : 1;
    enemies.push({
      x: (Math.random() * 2 - 1) * 2.75,
      z: -10 - Math.random() * 2.2,
      y: 0.27 + Math.random() * 0.18,
      speed: (isElite ? 2.2 : 2.7) + progress * (isElite ? 1.5 : 2.1) + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      gait: Math.random() * Math.PI * 2,
      shootT: Math.random() * 0.9,
      shootInterval: (isElite ? 0.62 : 0.95) + Math.random() * (isElite ? 0.32 : 0.65),
      r: enemyRadius,
      hp: hpBase,
      hpMax: hpBase,
      elite: isElite,
      color: ENEMY_COLORS[(Math.random() * ENEMY_COLORS.length) | 0],
      maskColor: ENEMY_MASK_COLORS[(Math.random() * ENEMY_MASK_COLORS.length) | 0],
      eyeColor: ENEMY_EYE_COLORS[(Math.random() * ENEMY_EYE_COLORS.length) | 0],
      flashT: 0,
      taunt: hasTaunt ? enemyTaunts[(Math.random() * enemyTaunts.length) | 0] : ''
    });
    if (hasTaunt && tauntCooldown <= 0) {
      tauntCooldown = 2.2;
      wx.showToast({ title: enemies[enemies.length - 1].taunt, icon: 'none', duration: 900 });
    }
  }

  function readTouchClientPos(touch) {
    // 优先使用本地坐标 x/y（模拟器鼠标事件最稳定）
    var x = touch.x;
    if (x === undefined || x === null) x = touch.clientX;
    if (x === undefined || x === null) x = touch.pageX;
    if (x === undefined || x === null) x = touch.screenX;
    if (x === undefined || x === null) x = touch.rawX;
    if (x === undefined || x === null) x = 0;
    var y = touch.y;
    if (y === undefined || y === null) y = touch.clientY;
    if (y === undefined || y === null) y = touch.pageY;
    if (y === undefined || y === null) y = touch.screenY;
    if (y === undefined || y === null) y = touch.rawY;
    if (y === undefined || y === null) y = h * 0.5;
    return { x: x, y: y };
  }

  function readPointerPosFromEvent(e) {
    if (!e) return null;
    var t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    var p = readTouchClientPos(t);
    if (p && isFinite(p.x) && isFinite(p.y)) return p;
    return null;
  }

  function normalizePointerToWindow(p) {
    if (!p) return null;
    var inputW = Math.max(1, windowW);
    var inputH = Math.max(1, windowH);
    var x = p.x;
    var y = p.y;
    // 兼容模拟器可能返回 canvas 像素坐标（通常大于 window 坐标）
    if (x > inputW * 1.5 && w > 0) x = (x / w) * inputW;
    if (y > inputH * 1.5 && h > 0) y = (y / h) * inputH;
    // 兼容比例坐标
    if (x >= 0 && x <= 1) x = x * inputW;
    if (y >= 0 && y <= 1) y = y * inputH;
    if (!isFinite(x) || !isFinite(y)) return null;
    return {
      x: Math.max(0, Math.min(inputW, x)),
      y: Math.max(0, Math.min(inputH, y))
    };
  }

  var pointerDragging = false;
  var lastPointerX = 0;
  var lastPointerY = 0;
  var _lastPointerDebugTs = 0;

  function updatePlayerTargetFromPointer(p) {
    var np = normalizePointerToWindow(p);
    if (!np) return;
    var inputW = Math.max(1, windowW);
    var inputH = Math.max(1, windowH);
    if (!pointerDragging) {
      // 首帧仅建立拖动锚点，避免点击瞬移导致“战机消失”
      pointerDragging = true;
      lastPointerX = np.x;
      lastPointerY = np.y;
      return;
    }
    var dx = np.x - lastPointerX;
    var dy = np.y - lastPointerY;
    lastPointerX = np.x;
    lastPointerY = np.y;
    // 增量控制：坐标系不一致时也能稳定移动
    targetPlayerX += (dx / inputW) * 8.2;
    targetPlayerZ += (-dy / inputH) * (PLAYER_Z_NEAR - PLAYER_Z_FAR) * 1.45;
    targetPlayerX = Math.max(-3.4, Math.min(3.4, targetPlayerX));
    targetPlayerZ = Math.max(PLAYER_Z_FAR, Math.min(PLAYER_Z_NEAR, targetPlayerZ));
    var nowDbg = Date.now();
    if (nowDbg - _lastPointerDebugTs > 250) {
      _lastPointerDebugTs = nowDbg;
      console.log('[3D][input]', 'dx=' + dx.toFixed(2), 'dy=' + dy.toFixed(2), 'targetX=' + targetPlayerX.toFixed(3), 'targetZ=' + targetPlayerZ.toFixed(3));
    }
  }

  wx.onTouchMove(function(e) {
    if (gameOver || !gameStarted || paused) return;
    var p = readPointerPosFromEvent(e);
    updatePlayerTargetFromPointer(p);
  });
  if (typeof wx.onMouseMove === 'function') {
    wx.onMouseMove(function(e) {
      if (gameOver || !gameStarted || paused) return;
      var p = readPointerPosFromEvent(e);
      updatePlayerTargetFromPointer(p);
    });
  }
  wx.onTouchStart(function(e) {
    var p = readPointerPosFromEvent(e);
    if (!p) return;
    var x = p.x;
    var y = p.y;
    if (!gameStarted && !gameOver) {
      if (x >= homeBtn.x && x <= homeBtn.x + homeBtn.width && y >= homeBtn.y && y <= homeBtn.y + homeBtn.height) {
        homeStartPressedUntil = Date.now() + 120;
        startGame();
      } else if (
        x >= homeIntroBtn.x &&
        x <= homeIntroBtn.x + homeIntroBtn.width &&
        y >= homeIntroBtn.y &&
        y <= homeIntroBtn.y + homeIntroBtn.height
      ) {
        homeIntroPressedUntil = Date.now() + 120;
        wx.showModal({
          title: '游戏介绍',
          content:
            '拖动屏幕：左右、上下移动战机，自动发射子弹。\n击落敌人增加得分，被敌人突破会掉血。\n在限定时间内达到目标分数即可通关。\n右上角按钮可暂停/继续。',
          showCancel: false,
          confirmText: '知道了'
        });
      }
      return;
    }
    if (gameStarted && !gameOver && paused) {
      paused = false;
      return;
    }
    if (gameStarted && !gameOver && x > w - 84 && y < 86) {
      paused = true;
      return;
    }
    if (gameOver) return;
    // 进入拖动态，但不立即改目标坐标（防点击瞬移）
    var np = normalizePointerToWindow(p);
    if (np) {
      pointerDragging = true;
      lastPointerX = np.x;
      lastPointerY = np.y;
    }
    return;
  });
  wx.onTouchEnd(function() {
    pointerDragging = false;
  });
  wx.onTouchCancel(function() {
    pointerDragging = false;
  });

  function bindMesh(buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(locMesh.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locMesh.nor, 3, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(locMesh.pos);
    gl.enableVertexAttribArray(locMesh.nor);
  }

  var ZERO3 = new Float32Array([0, 0, 0]);

  function drawMesh(buf, count, color, modelMat, emit, hot, addBurst) {
    bindMesh(buf);
    mul4(tmp, view, modelMat);
    mul4(mvp, proj, tmp);
    n3From4(modelMat, n3);
    gl.uniformMatrix4fv(locMesh.mvp, false, mvp);
    gl.uniformMatrix3fv(locMesh.n, false, n3);
    gl.uniform3fv(locMesh.light, LIGHT_DIR);
    gl.uniform3fv(locMesh.rgb, color);
    if (locMesh.emit) gl.uniform1f(locMesh.emit, emit == null ? 0 : emit);
    if (locMesh.hot) gl.uniform3fv(locMesh.hot, hot || ZERO3);
    if (locMesh.addBurst) gl.uniform1f(locMesh.addBurst, addBurst == null ? 0 : addBurst);
    gl.drawArrays(gl.TRIANGLES, 0, count);
  }

  function composePart(base, ox, oy, oz, sx, sy, sz, out) {
    translate4(tmp, ox, oy, oz);
    scale4(tmp2, sx, sy, sz);
    mul4(tmp3, tmp, tmp2);
    mul4(out, base, tmp3);
  }

  function billboardFacingCamera(cx, cy, cz, rollRad, outR, outU) {
    var lx = CAM_EX - cx;
    var ly = CAM_EY - cy;
    var lz = CAM_EZ - cz;
    var len = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
    lx /= len;
    ly /= len;
    lz /= len;
    var wx = 0;
    var wy = 1;
    var wz = 0;
    var rx = wy * lz - wz * ly;
    var ry = wz * lx - wx * lz;
    var rz = wx * ly - wy * lx;
    len = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    if (len < 1e-4) {
      rx = 1;
      ry = 0;
      rz = 0;
      len = 1;
    }
    rx /= len;
    ry /= len;
    rz /= len;
    var ux = ly * rz - lz * ry;
    var uy = lz * rx - lx * rz;
    var uz = lx * ry - ly * rx;
    var cr = Math.cos(rollRad);
    var sr = Math.sin(rollRad);
    var fvx = rx * cr + ux * sr;
    var fvy = ry * cr + uy * sr;
    var fvz = rz * cr + uz * sr;
    var fux = -rx * sr + ux * cr;
    var fuy = -ry * sr + uy * cr;
    var fuz = -rz * sr + uz * cr;
    outR[0] = fvx;
    outR[1] = fvy;
    outR[2] = fvz;
    outU[0] = fux;
    outU[1] = fuy;
    outU[2] = fuz;
  }

  function drawPlayerCubes(nowMs) {
    var pyBob = Math.sin(nowMs * 0.003) * 0.007;
    var zSpan = Math.max(0.08, PLAYER_Z_NEAR - PLAYER_Z_FAR);
    var z01 = Math.max(0, Math.min(1, (playerZ - PLAYER_Z_FAR) / zSpan));
    var zScale = 0.72 + z01 * 0.62;
    translate4(tmp, playerX, playerY + pyBob, playerZ);
    rotateY4(tmp2, playerBank * 0.22 + Math.sin(nowMs * 0.003) * 0.03);
    rotateZ4(tmp3, (playerRollTrimDeg * Math.PI) / 180);
    mul4(model, tmp2, tmp3);
    mul4(model, tmp, model);
    // keep player clearly visible on mobile screens
    scale4(tmp, 1.28 * zScale, 1.28 * zScale, 1.28 * zScale);
    mul4(model, model, tmp);

    composePart(model, 0, 0, -0.02, 0.32, 0.17, 0.95, tmp3);
    drawMesh(bCube, nCube, C_SHIP_BODY, tmp3);
    composePart(model, 0, 0.01, -0.56, 0.18, 0.12, 0.36, tmp3);
    drawMesh(bCube, nCube, C_SHIP_NOSE, tmp3);
    composePart(model, 0, -0.01, -0.06, 1.18, 0.05, 0.22, tmp3);
    drawMesh(bCube, nCube, C_SHIP_WING, tmp3);
    composePart(model, -0.44, -0.01 - playerWingBalanceY, -0.06, 0.34, 0.052, 0.22, tmp3);
    drawMesh(bCube, nCube, C_SHIP_WING2, tmp3);
    composePart(model, 0.44, -0.01 + playerWingBalanceY, -0.06, 0.34, 0.052, 0.22, tmp3);
    drawMesh(bCube, nCube, C_SHIP_WING2, tmp3);
    composePart(model, 0, 0.04, 0.28, 0.58, 0.04, 0.18, tmp3);
    drawMesh(bCube, nCube, C_SHIP_REAR, tmp3);
    composePart(model, -0.12, -0.03, 0.38, 0.1, 0.09, 0.28, tmp3);
    drawMesh(bCube, nCube, C_SHIP_ENGINE, tmp3);
    composePart(model, 0.12, -0.03, 0.38, 0.1, 0.09, 0.28, tmp3);
    drawMesh(bCube, nCube, C_SHIP_ENGINE, tmp3);
    composePart(model, -0.12, -0.04, 0.56, 0.07, 0.07, 0.08, tmp3);
    drawMesh(bCube, nCube, C_SHIP_GLOW, tmp3);
    composePart(model, 0.12, -0.04, 0.56, 0.07, 0.07, 0.08, tmp3);
    drawMesh(bCube, nCube, C_SHIP_GLOW, tmp3);
  }

  function drawPlayer(nowMs) {
    var pyBob = Math.sin(nowMs * 0.003) * 0.007;
    var cx = playerX;
    var cy = playerY + pyBob;
    var cz = playerZ;
    var zSpan = Math.max(0.08, PLAYER_Z_NEAR - PLAYER_Z_FAR);
    var z01 = Math.max(0, Math.min(1, (playerZ - PLAYER_Z_FAR) / zSpan));
    var rollRad =
      playerBank * 0.14 +
      Math.sin(nowMs * 0.003) * 0.01 +
      (playerRollTrimDeg * Math.PI) / 180 +
      (PLAYER_VISUAL_ROLL_FIX_DEG * Math.PI) / 180;
    // 玩家战机前景优先，避免被大背景模型遮挡到“看不见”
    gl.disable(gl.DEPTH_TEST);
    if (ENABLE_PLAYER_BILLBOARD && playerLoaded) {
      billboardFacingCamera(cx, cy, cz, rollRad, billRight, billUp);
      var halfW = Math.max(0.92, playerUsesProceduralTex ? 1.0 : 0.96) * (0.72 + z01 * 0.62);
      var halfH = halfW * playerImgAspect;
      gl.useProgram(pBill);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, bBillboard);
      gl.vertexAttribPointer(locBill.local, 2, gl.FLOAT, false, 16, 0);
      gl.vertexAttribPointer(locBill.uv, 2, gl.FLOAT, false, 16, 8);
      gl.enableVertexAttribArray(locBill.local);
      gl.enableVertexAttribArray(locBill.uv);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, playerTex);
      gl.uniform1i(locBill.tex, 0);
      gl.uniform3f(locBill.center, cx, cy, cz);
      gl.uniform3fv(locBill.right, billRight);
      gl.uniform3fv(locBill.up, billUp);
      gl.uniform1f(locBill.halfW, PLAYER_VISUAL_FLIP_X ? -halfW : halfW);
      gl.uniform1f(locBill.halfH, PLAYER_VISUAL_FLIP_Y ? -halfH : halfH);
      gl.uniformMatrix4fv(locBill.mvp, false, vp);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.useProgram(pMesh);
    }
    // 机身方块在 billboard 之后绝不可立刻 gl.enable(CULL_FACE)，否则当前视角下整架机会被背面剔除成「看不见」
    gl.disable(gl.CULL_FACE);
    // 双保险：即便贴图成功也保留实体机身，确保总能看见战机
    drawPlayerCubes(nowMs);
    // extra beacon glow so player is always locatable
    translate4(model, cx, cy + 0.04, cz - 0.02);
    scale4(tmp, 0.14 + Math.sin(nowMs * 0.012) * 0.02, 0.14 + Math.sin(nowMs * 0.012) * 0.02, 0.14);
    mul4(tmp2, model, tmp);
    drawMesh(bEnemySphere, nEnemySphere, ENEMY_EYE_COLORS[2], tmp2);
    if (gameStarted) {
      translate4(tmp, cx, cy, cz - 0.08);
      rotateY4(tmp2, playerBank * 0.22 + Math.sin(nowMs * 0.003) * 0.03);
      rotateZ4(tmp3, (playerRollTrimDeg * Math.PI) / 180);
      mul4(model, tmp2, tmp3);
      mul4(model, tmp, model);
      scale4(tmp, 0.2, 0.11, 0.52);
      mul4(tmp2, model, tmp);
      drawMesh(bCube, nCube, C_SHIP_GLOW, tmp2);
    }
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
  }

  function drawOneBullet(now, i) {
    var b = bullets[i];
    var pwr = b.p ? 1 : 0;
    var pb = pwr ? 1.22 : 1;
    var phase = now * 0.0022 + (b.seed || 0);
    var pulse = 1 + Math.sin(phase * 4.1) * 0.07;
    translate4(model, b.x, b.y, b.z);
    rotateX4(tmp, 0.22);
    mul4(tmp2, model, tmp);
    var coreRgb = pwr ? C_BULLET_PWR_CORE : C_BULLET_CORE;
    var hotRgb = pwr ? C_BULLET_PWR_HOT : C_BULLET_HOT;
    var em = pwr ? 2.05 : 1.55;
    scale4(tmp, 0.024 * pb * pulse, 0.024 * pb * pulse, 0.48 * pb);
    mul4(tmp3, tmp2, tmp);
    drawMesh(bCube, nCube, coreRgb, tmp3, em, hotRgb);
    scale4(tmp, 0.012 * pb, 0.012 * pb, 0.12 * pb);
    mul4(tmp3, tmp2, tmp);
    drawMesh(bCube, nCube, C_BULLET_WHITE, tmp3, 2.5, C_BULLET_WHITE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.depthMask(false);
    gl.depthFunc(gl.LEQUAL);
    scale4(tmp, 0.085 * pb, 0.085 * pb, 0.62 * pb);
    mul4(tmp3, tmp2, tmp);
    drawMesh(bCube, nCube, ZERO3, tmp3, 0, hotRgb, pwr ? 0.2 : 0.14);
    scale4(tmp, 0.055 * pb, 0.055 * pb, 0.95 * pb);
    mul4(tmp3, tmp2, tmp);
    drawMesh(bCube, nCube, ZERO3, tmp3, 0, C_BULLET_WHITE, pwr ? 0.06 : 0.038);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  function drawMuzzleFlashes() {
    var k;
    for (k = 0; k < muzzleFx.length; k++) {
      var m = muzzleFx[k];
      var r = Math.max(0, m.life / 0.11);
      var sc = 0.07 + (1 - r) * 0.16;
      translate4(model, m.x, m.y, m.z);
      scale4(tmp, sc, sc * 0.78, sc);
      mul4(tmp2, model, tmp);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      gl.depthFunc(gl.LEQUAL);
      drawMesh(bEnemySphere, nEnemySphere, ZERO3, tmp2, 0, C_MUZZLE_HOT, 0.48 * r);
      gl.depthFunc(gl.LESS);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
  }

  function showHome() {
    bgMode = 'home';
    bgIndex = Math.floor(Math.random() * homeBgFiles.length);
    loadBgAtIndex(bgIndex);
    gameStarted = false;
    gameOver = false;
    endedShown = false;
    paused = false;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    muzzleFx = [];
    playerX = 0;
    targetPlayerX = 0;
    playerY = PLAYER_Y_DEFAULT;
    playerZ = PLAYER_Z_DEFAULT;
    targetPlayerZ = PLAYER_Z_DEFAULT;
    playerBank = 0;
    spawnT = 0;
    fireT = 0;
    score = 0;
    hp = 5;
    buildUiAtlasTexture();
    buildHomeButtonLabelTextures();
  }

  function drawHomeOverlay() {
    if (gameStarted || gameOver) return;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pHud);
    gl.bindBuffer(gl.ARRAY_BUFFER, bHomeHud);
    gl.vertexAttribPointer(locHud.pos, 2, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locHud.col, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(locHud.pos);
    gl.enableVertexAttribArray(locHud.col);
    gl.drawArrays(gl.TRIANGLES, 0, nHomeHudVerts);
    if (uiAtlasOk) {
      drawUiTexRegion(0, 312 / UI_ATLAS_H, 1, 1, 0, 0.36, 0.94, 0.5);
    }
    var startPulse = 1 + Math.sin(homeFxT * 2.7) * 0.024;
    var startPressScale = Date.now() < homeStartPressedUntil ? 0.96 : 1;
    var introPressScale = Date.now() < homeIntroPressedUntil ? 0.97 : 1;
    if (homeStartLabelOk) {
      drawUiTexture(homeStartLabelTex, 0, -0.26, 0.44 * startPulse * startPressScale, 0.07 * startPulse * startPressScale);
    }
    if (homeIntroLabelOk) {
      drawUiTexture(homeIntroLabelTex, 0, -0.49, 0.44 * introPressScale, 0.065 * introPressScale);
    }
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(pMesh);
  }

  function drawPauseButtonInGame() {
    if (!gameStarted || gameOver || paused) return;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pHud);
    gl.bindBuffer(gl.ARRAY_BUFFER, bPauseBtnHud);
    gl.vertexAttribPointer(locHud.pos, 2, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locHud.col, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(locHud.pos);
    gl.enableVertexAttribArray(locHud.col);
    gl.drawArrays(gl.TRIANGLES, 0, nPauseBtnHudVerts);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(pMesh);
  }

  function drawPauseOverlay() {
    if (!paused || !gameStarted || gameOver) return;
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pHud);
    gl.bindBuffer(gl.ARRAY_BUFFER, bPauseDimHud);
    gl.vertexAttribPointer(locHud.pos, 2, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locHud.col, 4, gl.FLOAT, false, 24, 8);
    gl.enableVertexAttribArray(locHud.pos);
    gl.enableVertexAttribArray(locHud.col);
    gl.drawArrays(gl.TRIANGLES, 0, nPauseDimVerts);
    if (uiAtlasOk) {
      drawUiTexRegion(0, 0, 1, 312 / UI_ATLAS_H, 0, 0.02, 0.9, 0.38);
    }
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(pMesh);
  }

  function endGame(win) {
    if (endedShown) return;
    endedShown = true;
    gameOver = true;
    paused = false;
    wx.showModal({
      title: win ? '3D 通关' : '3D 失败',
      content: '得分: ' + score + ' / ' + needScore + (win ? '\n已达到目标分数。' : '\n再试一次！'),
      showCancel: true,
      cancelText: '首页',
      confirmText: '再来一局',
      success: function(res) {
        if (res.confirm) {
          startGame();
        } else {
          showHome();
        }
      }
    });
  }

  function startGame() {
    bgMode = 'battle';
    bgIndex = Math.floor(Math.random() * battleBgFiles.length);
    loadBgAtIndex(bgIndex);
    score = 0;
    hp = 5;
    playerX = 0;
    targetPlayerX = 0;
    playerBank = 0;
    bullets = [];
    enemyBullets = [];
    enemies = [];
    muzzleFx = [];
    spawnT = 0;
    spawnCount = 0;
    fireT = 0;
    powerTimer = 0;
    combo = 0;
    comboTimer = 0;
    gameOver = false;
    endedShown = false;
    paused = false;
    startAt = Date.now();
    // 强制开局全景位（避免初始帧贴脸）
    playerY = PLAYER_Y_DEFAULT;
    playerZ = PLAYER_Z_DEFAULT;
    targetPlayerZ = PLAYER_Z_DEFAULT;
    
    gameStarted = true;
    wx.showToast({ title: '3D开战', icon: 'none', duration: 900 });
  }

  showHome();

  var last = Date.now();
  var bgPanT = 0;
  var homeFxT = 0;
  function frame() {
    var now = Date.now();
    var dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    var left = duration - (now - startAt) / 1000;

    bgPanT += dt;
    homeFxT += dt;

    persp(proj, Math.PI / 3.6, w / h, 0.1, 100);
    lookAt(view, 0, 5.7, 1.85, 0, 0.25, -6.6, 0, 1, 0);
    mul4(vp, proj, view);

    var starSpd = 2.2;
    if (gameStarted && !gameOver && !paused) starSpd = 5.5;
    if (gameStarted && !gameOver && paused) starSpd = 0;
    for (i = 0; i < starCount; i++) {
      var zi = i * 3 + 2;
      stars[zi] += starSpd * dt;
      if (stars[zi] > 2) stars[zi] = -22;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, bStars);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, stars);

    if (gameStarted && !gameOver && !paused) {
      tauntCooldown = Math.max(0, tauntCooldown - dt);
      powerTimer = Math.max(0, powerTimer - dt);
      comboTimer = Math.max(0, comboTimer - dt);
      if (combo > 0 && comboTimer <= 0) combo = 0;
      var smooth = Math.min(1, dt * 24);
      var prevX = playerX;
      playerX += (targetPlayerX - playerX) * smooth;
      playerZ += (targetPlayerZ - playerZ) * smooth;
      playerY = PLAYER_Y_DEFAULT;
      playerZ = Math.max(PLAYER_Z_FAR, Math.min(PLAYER_Z_NEAR, playerZ));
      targetPlayerZ = Math.max(PLAYER_Z_FAR, Math.min(PLAYER_Z_NEAR, targetPlayerZ));
      playerBank = (playerX - prevX) * 8;
      spawnT += dt;
      fireT += dt;
      bgChangeTimer += dt;
      if (bgChangeTimer >= bgChangeInterval) {
        bgChangeTimer = 0;
        bgIndex = (bgIndex + 1) % battleBgFiles.length;
        loadBgAtIndex(bgIndex);
      }

      var spawnInterval = Math.max(0.28, 0.58 - Math.min(1, score / needScore) * 0.24);
      if (spawnT >= spawnInterval) {
        spawnT = 0;
        spawnEnemy();
      }
      var fireInterval = powerTimer > 0 ? 0.055 : 0.09;
      if (fireT >= fireInterval) {
        fireT = 0;
        // 机翼双发：按屏幕上战机两翼位置反投影到 3D，确保“看到哪儿就从哪儿出弹”
        var bz = playerZ - 0.22;
        var wingNdcXOffset;
        var muzzleNdcY;
        var leftOk;
        var rightOk;
        var leftXY = [0, 0];
        var rightXY = [0, 0];
        computePlayerSpriteNdc(playerNdc);
        wingNdcXOffset = playerNdc.hw * 0.52;
        muzzleNdcY = playerNdc.ty + playerNdc.hh * 0.16;
        leftOk = worldFromNdcOnPlane(leftXY, vp, playerNdc.tx - wingNdcXOffset, muzzleNdcY, bz);
        rightOk = worldFromNdcOnPlane(rightXY, vp, playerNdc.tx + wingNdcXOffset, muzzleNdcY, bz);
        if (!leftOk || !rightOk) {
          var bypFallback = playerY - 0.01;
          var wingOffsetFallback = 0.52;
          leftXY[0] = playerX - wingOffsetFallback;
          leftXY[1] = bypFallback;
          rightXY[0] = playerX + wingOffsetFallback;
          rightXY[1] = bypFallback;
        }
        bullets.push({
          x: leftXY[0],
          y: leftXY[1],
          z: bz,
          p: powerTimer > 0 ? 1 : 0,
          seed: Math.random() * 6.28318
        });
        bullets.push({
          x: rightXY[0],
          y: rightXY[1],
          z: bz,
          p: powerTimer > 0 ? 1 : 0,
          seed: Math.random() * 6.28318
        });
        if (bullets.length > 220) bullets.splice(0, bullets.length - 220);
        muzzleFx.push({ x: leftXY[0], y: leftXY[1], z: bz + 0.04, life: 0.11 });
        muzzleFx.push({ x: rightXY[0], y: rightXY[1], z: bz + 0.04, life: 0.11 });
        if (muzzleFx.length > 36) muzzleFx.splice(0, muzzleFx.length - 36);
      }

      for (i = muzzleFx.length - 1; i >= 0; i--) {
        muzzleFx[i].life -= dt;
        if (muzzleFx[i].life <= 0) muzzleFx.splice(i, 1);
      }

      for (i = bullets.length - 1; i >= 0; i--) {
        bullets[i].z -= 14 * dt;
        if (bullets[i].z < -13) bullets.splice(i, 1);
      }

      for (i = enemies.length - 1; i >= 0; i--) {
        enemies[i].phase += dt * 2.2;
        enemies[i].gait += dt * (4.2 + enemies[i].speed * 0.22);
        enemies[i].flashT = Math.max(0, (enemies[i].flashT || 0) - dt);
        enemies[i].y += Math.sin(enemies[i].phase) * 0.0016;
        enemies[i].shootT += dt;
        if (enemies[i].shootT >= enemies[i].shootInterval) {
          enemies[i].shootT = 0;
          enemyBullets.push({
            x: enemies[i].x,
            y: enemies[i].y,
            z: enemies[i].z + (enemies[i].r || 0.42) * 0.6,
            vx: (playerX - enemies[i].x) * 0.2,
            vy: (playerY - enemies[i].y) * 0.28,
            vz: 5.8 + Math.random() * 1.4
          });
          if (enemyBullets.length > 260) enemyBullets.splice(0, enemyBullets.length - 260);
        }
        enemies[i].z += enemies[i].speed * dt;
        if (enemies[i].z > 1.0) {
          hp--;
          enemies.splice(i, 1);
          if (hp <= 0) endGame(false);
        }
      }

      for (i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].x += enemyBullets[i].vx * dt;
        enemyBullets[i].y += (enemyBullets[i].vy || 0) * dt;
        enemyBullets[i].z += enemyBullets[i].vz * dt;
        if (enemyBullets[i].z > 1.3) {
          enemyBullets.splice(i, 1);
          continue;
        }
        var pdx = enemyBullets[i].x - playerX;
        var pdy = enemyBullets[i].y - playerY;
        var pdz = enemyBullets[i].z - playerZ;
        if (pdx * pdx + pdy * pdy * 1.35 + pdz * pdz < 0.12) {
          enemyBullets.splice(i, 1);
          hp--;
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
          var dy = b.y - e.y;
          var dz = b.z - e.z;
          var hitR = (e.r || 0.42) * 0.62;
          if (dx * dx + dy * dy * 1.25 + dz * dz < hitR * hitR) {
            bullets.splice(j, 1);
            hit = true;
            e.hp -= 1;
            e.flashT = 0.08;
            break;
          }
        }
        if (hit && e.hp <= 0) {
          var scoreGain = e.elite ? 3 : 1;
          combo = Math.min(60, combo + 1);
          comboTimer = 2.2;
          var mul = 1 + Math.min(4, (combo / 10) | 0) * 0.2;
          enemies.splice(i, 1);
          score += Math.floor(scoreGain * mul);
          if (e.elite) {
            powerTimer = Math.max(powerTimer, 6);
            wx.showToast({ title: '火力过载 +6s', icon: 'none', duration: 700 });
          } else if (combo > 0 && combo % 10 === 0) {
            wx.showToast({ title: '连击 x' + combo, icon: 'none', duration: 500 });
          }
        }
      }

      playerBank *= 0.7;
      if (score >= needScore) endGame(true);
      if (left <= 0) endGame(score >= needScore);
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // background image pass（必须 depthMask=false：否则全屏会把深度写成常数，后面整层 3D/精灵深度测试大面积失败）
    gl.useProgram(pBg);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.bindBuffer(gl.ARRAY_BUFFER, bBg);
    gl.vertexAttribPointer(locBg.pos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(locBg.uv, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(locBg.pos);
    gl.enableVertexAttribArray(locBg.uv);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTex);
    gl.uniform1i(locBg.tex, 0);
    gl.uniform1f(locBg.mix, bgLoaded ? 0.94 : 0.0);
    // 首页轻微漂移；战斗中加大视差（仍限制在 clamp 内，用多频 sin 模拟纵深移动）
    var du;
    var dv;
    if (gameStarted && !gameOver) {
      du =
        Math.sin(bgPanT * 0.52) * 0.055 +
        Math.sin(bgPanT * 0.19) * 0.028 +
        Math.cos(bgPanT * 0.31) * 0.018;
      dv =
        Math.cos(bgPanT * 0.44) * 0.062 +
        Math.sin(bgPanT * 0.27) * 0.032 +
        Math.sin(bgPanT * 0.11) * 0.022;
    } else {
      du = Math.sin(bgPanT * 0.32) * 0.02;
      dv = Math.cos(bgPanT * 0.24) * 0.016;
    }
    gl.uniform2f(locBg.scroll, du, dv);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // stars：不写深度 + 半透明混合，避免点精灵深度挡战机/子弹
    gl.useProgram(pStar);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.bindBuffer(gl.ARRAY_BUFFER, bStars);
    gl.vertexAttribPointer(locStar.pos, 3, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(locStar.pos);
    gl.uniformMatrix4fv(locStar.vp, false, vp);
    gl.drawArrays(gl.POINTS, 0, starCount);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);

    // mesh pass
    gl.useProgram(pMesh);
    id4(model);
    drawMesh(bFloor, nFloor, C_FLOOR, model);

    // far planets
    translate4(model, 2.55, 2.6, -10.8);
    scale4(tmp, 1.25, 1.25, 1.25);
    mul4(tmp2, model, tmp);
    drawMesh(bCube, nCube, C_PLANET_A, tmp2);

    translate4(model, -2.9, 3.1, -9.4);
    scale4(tmp, 0.78, 0.78, 0.78);
    mul4(tmp2, model, tmp);
    drawMesh(bCube, nCube, C_PLANET_B, tmp2);

    drawPlayer(now);

    for (i = 0; i < bullets.length; i++) {
      drawOneBullet(now, i);
    }
    for (i = 0; i < enemyBullets.length; i++) {
      translate4(model, enemyBullets[i].x, enemyBullets[i].y, enemyBullets[i].z);
      var ep = 1 + Math.sin(now * 0.018 + i) * 0.12;
      scale4(tmp, 0.065 * ep, 0.065 * ep, 0.2);
      mul4(tmp2, model, tmp);
      drawMesh(bCube, nCube, ENEMY_EYE_COLORS[0], tmp2);
      scale4(tmp, 0.038 * ep, 0.038 * ep, 0.12);
      mul4(tmp2, model, tmp);
      drawMesh(bCube, nCube, ENEMY_EYE_COLORS[1], tmp2);
    }
    for (i = 0; i < enemies.length; i++) {
      rotateY4(tmp, now * 0.0025 + i);
      translate4(tmp2, enemies[i].x, enemies[i].y, enemies[i].z);
      mul4(model, tmp2, tmp);
      var er = enemies[i].r || 0.42;
      var ec = enemies[i].color || ENEMY_COLORS[0];
      var mc = enemies[i].maskColor || ENEMY_MASK_COLORS[0];
      var eye = enemies[i].eyeColor || ENEMY_EYE_COLORS[0];
      var hpRatioE = Math.max(0.2, (enemies[i].hp || 1) / (enemies[i].hpMax || 1));
      var drawColor = hpRatioE < 0.45 ? ENEMY_EYE_COLORS[0] : ec;
      var gait = enemies[i].gait || 0;
      var armSwing = Math.sin(gait) * er * 0.18;
      var legSwing = Math.sin(gait + Math.PI * 0.5) * er * 0.16;
      var headBob = Math.sin(gait * 0.7) * er * 0.06;
      var tentacleSwing = Math.sin(gait * 1.35) * er * 0.22;
      if ((enemies[i].flashT || 0) > 0) {
        drawColor = ENEMY_EYE_COLORS[1];
      }
      // alien-like silhouette (bio-mech)
      // torso core
      scale4(tmp, er * 0.62, er * 0.84, er * 0.4);
      mul4(tmp2, model, tmp);
      drawMesh(bEnemySphere, nEnemySphere, drawColor, tmp2);
      // abdomen
      translate4(tmp, 0, -er * 0.52, -er * 0.08);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.52, er * 0.38, er * 0.34);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bEnemySphere, nEnemySphere, mc, tmp3);
      // elongated head
      translate4(tmp, 0, er * 0.9 + headBob, er * 0.06);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.34, er * 0.46, er * 0.3);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bEnemySphere, nEnemySphere, mc, tmp3);
      // jaw
      translate4(tmp, 0, er * 0.72, er * 0.22);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.28, er * 0.14, er * 0.16);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, drawColor, tmp3);
      // arms (claw-like)
      translate4(tmp, -er * 0.68, -er * 0.06 + armSwing, er * 0.05);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.16, er * 0.5, er * 0.16);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, mc, tmp3);
      translate4(tmp, er * 0.68, -er * 0.06 - armSwing, er * 0.05);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.16, er * 0.5, er * 0.16);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, mc, tmp3);
      // legs
      translate4(tmp, -er * 0.2, -er * 0.98 + legSwing, 0);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.18, er * 0.56, er * 0.18);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, mc, tmp3);
      translate4(tmp, er * 0.2, -er * 0.98 - legSwing, 0);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.18, er * 0.56, er * 0.18);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, mc, tmp3);
      // feet claws
      translate4(tmp, -er * 0.2, -er * 1.3 + legSwing, er * 0.12);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.26, er * 0.08, er * 0.28);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, drawColor, tmp3);
      translate4(tmp, er * 0.2, -er * 1.3 - legSwing, er * 0.12);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.26, er * 0.08, er * 0.28);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, drawColor, tmp3);
      // back spines / tentacle roots
      translate4(tmp, -er * 0.22, er * 0.44, -er * 0.3);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.08, er * 0.42, er * 0.08);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, mc, tmp3);
      translate4(tmp, er * 0.22, er * 0.44, -er * 0.3);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.08, er * 0.42, er * 0.08);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bCube, nCube, mc, tmp3);
      // tentacle tails (2-segment each side)
      translate4(tmp, -er * 0.34, -er * 0.36, -er * 0.28);
      mul4(tmp2, model, tmp);
      rotateY4(tmp, tentacleSwing * 0.9);
      mul4(tmp3, tmp2, tmp);
      scale4(tmp, er * 0.09, er * 0.4, er * 0.09);
      mul4(tmp2, tmp3, tmp);
      drawMesh(bCube, nCube, mc, tmp2);
      translate4(tmp, 0, -er * 0.36, 0);
      mul4(tmp2, tmp3, tmp);
      rotateY4(tmp, tentacleSwing * 1.2);
      mul4(tmp3, tmp2, tmp);
      scale4(tmp, er * 0.08, er * 0.34, er * 0.08);
      mul4(tmp2, tmp3, tmp);
      drawMesh(bCube, nCube, drawColor, tmp2);

      translate4(tmp, er * 0.34, -er * 0.36, -er * 0.28);
      mul4(tmp2, model, tmp);
      rotateY4(tmp, -tentacleSwing * 0.9);
      mul4(tmp3, tmp2, tmp);
      scale4(tmp, er * 0.09, er * 0.4, er * 0.09);
      mul4(tmp2, tmp3, tmp);
      drawMesh(bCube, nCube, mc, tmp2);
      translate4(tmp, 0, -er * 0.36, 0);
      mul4(tmp2, tmp3, tmp);
      rotateY4(tmp, -tentacleSwing * 1.2);
      mul4(tmp3, tmp2, tmp);
      scale4(tmp, er * 0.08, er * 0.34, er * 0.08);
      mul4(tmp2, tmp3, tmp);
      drawMesh(bCube, nCube, drawColor, tmp2);
      // glowing eye cores
      translate4(tmp, -er * 0.1, er * 0.92, er * 0.24);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.07, er * 0.07, er * 0.07);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bEnemySphere, nEnemySphere, eye, tmp3);
      translate4(tmp, er * 0.1, er * 0.92, er * 0.24);
      mul4(tmp2, model, tmp);
      scale4(tmp, er * 0.07, er * 0.07, er * 0.07);
      mul4(tmp3, tmp2, tmp);
      drawMesh(bEnemySphere, nEnemySphere, eye, tmp3);
      // elite aura core
      if (enemies[i].elite) {
        translate4(tmp, 0, er * 0.16, -er * 0.18);
        mul4(tmp2, model, tmp);
        scale4(tmp, er * 0.22, er * 0.22, er * 0.22);
        mul4(tmp3, tmp2, tmp);
        drawMesh(bEnemySphere, nEnemySphere, ENEMY_EYE_COLORS[1], tmp3);
      }
    }

    drawPauseButtonInGame();

    if (gameStarted && !gameOver && !paused) {
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
    }

    drawPauseOverlay();

    drawHomeOverlay();

    // 仅保留 3D 战机渲染，避免底部出现 2D 兜底残影/错位

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
