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
  'uniform mat4 uModel;',
  'uniform mat3 uN;',
  'uniform mediump vec3 uLight;',
  'varying vec3 vShade;',
  'varying vec3 vNor;',
  'varying vec3 vWPos;',
  'void main(){',
  '  vec3 n = normalize(uN * aNor);',
  '  float d = max(dot(n, normalize(-uLight)), 0.2);',
  '  vShade = vec3(0.16 + d * 0.84);',
  '  vNor = n;',
  '  vWPos = (uModel * vec4(aPos, 1.0)).xyz;',
  '  gl_Position = uMVP * vec4(aPos, 1.0);',
  '}'
].join('');

var FSH_MESH = [
  'precision mediump float;',
  'varying vec3 vShade;',
  'varying vec3 vNor;',
  'varying vec3 vWPos;',
  'uniform vec3 uRgb;',
  'uniform float uEmit;',
  'uniform vec3 uHot;',
  'uniform float uAddBurst;',
  'uniform vec3 uCam;',
  'uniform mediump vec3 uLight;',
  'uniform float uSpecPow;',
  'uniform float uSpecStrength;',
  'uniform float uRimStrength;',
  'void main(){',
  '  if (uAddBurst > 0.001) {',
  '    gl_FragColor = vec4(uHot * uAddBurst, 1.0);',
  '    return;',
  '  }',
  '  vec3 n = normalize(vNor);',
  '  vec3 viewDir = normalize(uCam - vWPos);',
  '  vec3 halfV = normalize(normalize(-uLight) + viewDir);',
  '  float spec = pow(max(dot(n, halfV), 0.0), max(1.0, uSpecPow)) * uSpecStrength;',
  '  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.3) * uRimStrength;',
  '  vec3 lit = uRgb * vShade;',
  '  vec3 add = uHot * uEmit;',
  '  vec3 finalRgb = min(lit + add + vec3(spec) + uRgb * rim * 0.55, vec3(1.0));',
  '  gl_FragColor = vec4(finalRgb, 1.0);',
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
  'uniform sampler2D uTexA;',
  'uniform sampler2D uTexB;',
  'uniform float uBlend;',
  'uniform float uMix;',
  'uniform vec2 uScroll;',
  'void main(){',
  '  vec2 p = vUV * 2.0 - 1.0;',
  '  float edgeCurve = p.x * p.x * (0.055 + (1.0 - vUV.y) * 0.03);',
  '  float horizonLift = (1.0 - vUV.y) * 0.07;',
  '  vec2 uvNear = vUV + uScroll + vec2(0.0, edgeCurve - horizonLift);',
  '  vec2 uvMid = (vUV - 0.5) * vec2(0.92, 0.95) + 0.5 + uScroll * 0.68 + vec2(0.0, edgeCurve * 0.65 - horizonLift * 0.76);',
  '  vec2 uvFar = (vUV - 0.5) * vec2(0.84, 0.88) + 0.5 + uScroll * 0.42 + vec2(0.0, edgeCurve * 0.42 - horizonLift * 0.54);',
  '  uvNear = clamp(uvNear, vec2(0.002), vec2(0.998));',
  '  uvMid = clamp(uvMid, vec2(0.002), vec2(0.998));',
  '  uvFar = clamp(uvFar, vec2(0.002), vec2(0.998));',
  '  vec3 nearA = texture2D(uTexA, uvNear).rgb;',
  '  vec3 nearB = texture2D(uTexB, uvNear).rgb;',
  '  vec3 midA = texture2D(uTexA, uvMid).rgb;',
  '  vec3 midB = texture2D(uTexB, uvMid).rgb;',
  '  vec3 farA = texture2D(uTexA, uvFar).rgb;',
  '  vec3 farB = texture2D(uTexB, uvFar).rgb;',
  '  float blendT = clamp(uBlend, 0.0, 1.0);',
  '  vec3 nearTex = mix(nearA, nearB, blendT);',
  '  vec3 midTex = mix(midA, midB, blendT);',
  '  vec3 farTex = mix(farA, farB, blendT);',
  '  float dNear = smoothstep(0.32, 0.98, vUV.y);',
  '  float dMid = smoothstep(0.18, 0.9, vUV.y);',
  '  vec3 tex = mix(farTex * 0.83, midTex * 0.92, dMid);',
  '  tex = mix(tex, nearTex, dNear);',
  '  tex = clamp((tex - vec3(0.5)) * 1.16 + vec3(0.5), 0.0, 1.0);',
  '  float fog = smoothstep(0.0, 0.62, 1.0 - vUV.y);',
  '  tex = mix(tex, tex * vec3(0.74, 0.81, 0.92), fog * 0.4);',
  '  float vignette = smoothstep(1.15, 0.28, dot(p * vec2(0.9, 1.15), p * vec2(0.9, 1.15)));',
  '  tex *= mix(0.82, 1.0, vignette);',
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
  'uniform float uChromaOn;',
  'uniform vec3 uChromaKey;',
  'uniform float uChromaThreshold;',
  'void main(){',
  '  vec4 c = texture2D(uTex, vUV);',
  '  if (uChromaOn > 0.5) {',
  '    float d = distance(c.rgb, uChromaKey);',
  '    float cyanMask = step(0.42, c.g) * step(0.52, c.b) * step(c.r, 0.46) * step(0.16, c.b - c.r) * step(0.1, c.g - c.r);',
  '    float inCenterX = step(0.34, vUV.x) * step(vUV.x, 0.66);',
  '    float inCenterY = step(0.2, vUV.y) * step(vUV.y, 0.82);',
  '    float centerMask = inCenterX * inCenterY;',
  '    float hardCenterCyan = centerMask * step(0.34, c.g) * step(0.45, c.b) * step(c.r, 0.52);',
  '    if (d < uChromaThreshold || cyanMask > 0.5 || hardCenterCyan > 0.5) discard;',
  '  }',
  '  vec2 p = vUV - vec2(0.5);',
  '  float rr = dot(p, p);',
  '  if (rr > 0.25) discard;',
  '  float edge = smoothstep(0.25, 0.21, rr);',
  '  float a = c.a * edge;',
  '  if (a < 0.02) discard;',
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
  var rawCanvasW = canvas.width;
  var rawCanvasH = canvas.height;
  var windowW = rawCanvasW;
  var windowH = rawCanvasH;
  var pixelRatio = 1;
  try {
    var winInfo = wx.getWindowInfo ? wx.getWindowInfo() : (wx.getSystemInfoSync ? wx.getSystemInfoSync() : null);
    if (winInfo) {
      windowW = winInfo.windowWidth || winInfo.screenWidth || rawCanvasW;
      windowH = winInfo.windowHeight || winInfo.screenHeight || rawCanvasH;
      pixelRatio = winInfo.pixelRatio || pixelRatio;
    }
  } catch (e) {}
  if (!isFinite(pixelRatio) || pixelRatio <= 0) {
    pixelRatio = rawCanvasW > 0 && windowW > 0 ? rawCanvasW / windowW : 1;
  }
  pixelRatio = Math.max(1, Math.min(3, pixelRatio));
  var renderW = Math.max(1, Math.round(windowW * pixelRatio));
  var renderH = Math.max(1, Math.round(windowH * pixelRatio));
  if (canvas.width !== renderW) canvas.width = renderW;
  if (canvas.height !== renderH) canvas.height = renderH;
  // 逻辑坐标使用窗口尺寸，渲染坐标使用高 DPI 画布尺寸
  var w = windowW;
  var h = windowH;
  var uiScaleX = renderW / Math.max(1, w);
  var uiScaleY = renderH / Math.max(1, h);
  // Y 使用世界坐标范围（不是屏幕比例）
  var PLAYER_Y_MIN = -2.0;
  var PLAYER_Y_MAX = 2.0;
  var PLAYER_Y_DEFAULT = 0.25;
  // 屏幕内横向移动边界
  var PLAYER_X_LIMIT = 4.5;
  // 世界坐标无限移动（不再对 X/Y 做边界夹取）
  // 相机注视点 Y：与机体对齐（原静止镜头下 centerY=0.25 对应 playerY≈0.64）
  var CAM_LOOK_AT_Y = function(py) {
    return py - 0.39;
  };
  // Z 仅保留稳定范围；当前控制模式下默认固定到 PLAYER_Z_DEFAULT
  var PLAYER_Z_NEAR = 0.8;
  var PLAYER_Z_FAR = -4.8;
  // 相机前方安全上限（防止战机靠得太近被透视/裁剪看起来“消失”）
  var PLAYER_Z_SAFE_MAX = 0.25;
  // 开局默认后撤到全景位，确保进入战斗无需点击即可看到战机完整轮廓
  var PLAYER_Z_DEFAULT = -2.7;
  // 贴图朝向修正：不同素材坐标系可能相反，可在此翻转
  var PLAYER_VISUAL_FLIP_X = true;
  var PLAYER_VISUAL_FLIP_Y = true;
  // 战机固定滚转矫正（让机身默认垂直朝上）
  // 当前素材在包内朝向接近反向，叠加 180 度后再微调
  // 启用贴图后重校：让机头默认朝屏幕上方
  var PLAYER_VISUAL_ROLL_FIX_DEG = 0;
  // 自动校准后的最终偏移（用于修正特定素材仍有轻微偏角）
  var PLAYER_VISUAL_CALIB_OFFSET_DEG = 0;
  // 方向参数：只负责机头朝向（与平衡参数互不影响）
  var PLAYER_VISUAL_FORCE_BASE_DEG = -15;
  // 调角阶段先关闭自动校准叠加，避免与手动角互相抵消
  var PLAYER_VISUAL_USE_AUTO_CALIB = false;
  // 贴图层动态横滚强度：0=完全水平，仅保留基准朝向
  var PLAYER_VISUAL_DYNAMIC_ROLL_GAIN = 0;
  // 平衡参数：只负责左右高低（与方向参数互不影响）
  // 正值抬右压左，负值抬左压右，建议范围 -0.35 ~ 0.35
  var PLAYER_VISUAL_BALANCE_SHEAR = 0.40;
  var playerVisualAutoRollDeg = 0;
  // 启用战机贴图层作为主视觉，3D 机体仅作加载失败兜底
  var ENABLE_PLAYER_BILLBOARD = true;
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    wx.showModal({ title: '3D 不可用', content: '当前设备无法创建 WebGL。', showCancel: false });
    return;
  }
  gl.viewport(0, 0, renderW, renderH);

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
    model: gl.getUniformLocation(pMesh, 'uModel'),
    n: gl.getUniformLocation(pMesh, 'uN'),
    light: gl.getUniformLocation(pMesh, 'uLight'),
    cam: gl.getUniformLocation(pMesh, 'uCam'),
    rgb: gl.getUniformLocation(pMesh, 'uRgb'),
    emit: gl.getUniformLocation(pMesh, 'uEmit'),
    hot: gl.getUniformLocation(pMesh, 'uHot'),
    addBurst: gl.getUniformLocation(pMesh, 'uAddBurst'),
    specPow: gl.getUniformLocation(pMesh, 'uSpecPow'),
    specStrength: gl.getUniformLocation(pMesh, 'uSpecStrength'),
    rimStrength: gl.getUniformLocation(pMesh, 'uRimStrength')
  };
  var locStar = {
    pos: gl.getAttribLocation(pStar, 'aPos'),
    vp: gl.getUniformLocation(pStar, 'uVP')
  };
  var locBg = {
    pos: gl.getAttribLocation(pBg, 'aPos'),
    uv: gl.getAttribLocation(pBg, 'aUV'),
    texA: gl.getUniformLocation(pBg, 'uTexA'),
    texB: gl.getUniformLocation(pBg, 'uTexB'),
    blend: gl.getUniformLocation(pBg, 'uBlend'),
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
    tex: gl.getUniformLocation(pBill, 'uTex'),
    chromaOn: gl.getUniformLocation(pBill, 'uChromaOn'),
    chromaKey: gl.getUniformLocation(pBill, 'uChromaKey'),
    chromaThreshold: gl.getUniformLocation(pBill, 'uChromaThreshold')
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
  var bgTexA = gl.createTexture();
  var bgTexB = gl.createTexture();
  function initBgTexture(tex) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([5, 8, 20]));
  }
  initBgTexture(bgTexA);
  initBgTexture(bgTexB);
  var bgLoaded = false;
  var bgCurrentTex = 0;
  var bgNextTex = 0;
  var bgBlending = false;
  var bgBlend = 1;
  var bgBlendDuration = 0.55;
  var bgLoadToken = 0;
  var homeBgFiles = ['01.jpg', '02.jpg', '03.jpg'];
  var battleBgFiles = ['01.png', '02.png', '03.png', '04.png'];
  var bgMode = 'home';
  var bgIndex = Math.floor(Math.random() * homeBgFiles.length);
  var bgChangeTimer = 0;
  var bgChangeInterval = 12;
  var mapChunkCooldown = 0;
  var lastMapChunkIx = 0;
  var lastMapChunkIy = 0;

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

  function getBgTexture(idx) {
    return idx === 0 ? bgTexA : bgTexB;
  }

  function uploadBgFromImage(tex, im, logTag) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
    console.log('[3D] 背景贴图 OK', logTag || '', im.width, im.height);
  }

  function loadBgAtIndex(ix) {
    var myToken = ++bgLoadToken;
    var list = bgMode === 'home' ? homeBgFiles : battleBgFiles;
    var folder = bgMode === 'home' ? 'assets/home/' : 'assets/background/';
    var name = list[ix % list.length];
    var rel = folder + name;
    var incomingTex = bgLoaded ? (1 - bgCurrentTex) : bgCurrentTex;
    loadImageFromPackage(
      packageImagePathVariants(rel),
      function(im, tag) {
        if (myToken !== bgLoadToken) return;
        uploadBgFromImage(getBgTexture(incomingTex), im, tag);
        if (!bgLoaded) {
          bgCurrentTex = incomingTex;
          bgNextTex = incomingTex;
          bgBlend = 1;
          bgBlending = false;
          bgLoaded = true;
          return;
        }
        bgNextTex = incomingTex;
        bgBlend = 0;
        bgBlending = true;
      },
      function() {
        if (myToken !== bgLoadToken) return;
        console.error('[3D] 背景资源加载失败，已用纯色底。请确认', rel, '在游戏包内');
        if (!bgLoaded) bgLoaded = false;
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
    playerVisualAutoRollDeg = 0;
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

  function scrubPlayerCyanMarker(im) {
    if (!im || !im.width || !im.height || !wx.createOffscreenCanvas) return im;
    var oc = wx.createOffscreenCanvas({ type: '2d', width: im.width, height: im.height });
    oc.width = im.width;
    oc.height = im.height;
    var c2 = oc.getContext('2d');
    if (!c2 || !c2.getImageData) return im;
    c2.clearRect(0, 0, oc.width, oc.height);
    c2.drawImage(im, 0, 0, oc.width, oc.height);
    var img = c2.getImageData(0, 0, oc.width, oc.height);
    var px = img.data;
    var i;
    for (i = 0; i < px.length; i += 4) {
      var r = px[i];
      var g = px[i + 1];
      var b = px[i + 2];
      var a = px[i + 3];
      if (a < 8) continue;
      // 去除素材中央常见的亮青色占位块（保留真实机体高光）
      if (b > 150 && g > 125 && r < 95 && (b - r) > 80 && (g - r) > 55) {
        px[i + 3] = 0;
      }
    }
    // 兜底硬处理：清除战机贴图中央竖向占位块区域（真机上该块颜色可能被压缩失真）
    var x0 = Math.floor(oc.width * 0.43);
    var x1 = Math.ceil(oc.width * 0.57);
    var y0 = Math.floor(oc.height * 0.24);
    var y1 = Math.ceil(oc.height * 0.82);
    var yy;
    var xx;
    for (yy = y0; yy < y1; yy++) {
      for (xx = x0; xx < x1; xx++) {
        var p = (yy * oc.width + xx) * 4;
        // 仅清掉偏青/偏蓝区域，避免误伤机身主体
        if (px[p + 2] > px[p] + 25 && px[p + 1] > px[p] + 12) {
          px[p + 3] = 0;
        }
      }
    }
    c2.putImageData(img, 0, 0);
    return oc;
  }

  function calibratePlayerVisualBaseDeg(im) {
    if (!im || !im.width || !im.height || !wx.createOffscreenCanvas) return 0;
    var sw = im.width;
    var sh = im.height;
    var longEdge = Math.max(sw, sh);
    var sampleScale = longEdge > 220 ? 220 / longEdge : 1;
    var cw = Math.max(32, Math.round(sw * sampleScale));
    var ch = Math.max(32, Math.round(sh * sampleScale));
    var oc = wx.createOffscreenCanvas({ type: '2d', width: cw, height: ch });
    oc.width = cw;
    oc.height = ch;
    var c2 = oc.getContext('2d');
    if (!c2 || !c2.getImageData) return 0;
    c2.clearRect(0, 0, cw, ch);
    c2.drawImage(im, 0, 0, cw, ch);
    var img = c2.getImageData(0, 0, cw, ch);
    if (!img || !img.data) return 0;
    var px = img.data;
    var i;
    var x;
    var y;
    var alphaSoftCount = 0;
    for (i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 250) alphaSoftCount++;
    }
    var useBgSeg = alphaSoftCount < ((cw * ch) >> 7);
    var bgR = 0;
    var bgG = 0;
    var bgB = 0;
    var bgN = 0;
    function sampleBg(ix, iy) {
      var p = (iy * cw + ix) * 4;
      bgR += px[p];
      bgG += px[p + 1];
      bgB += px[p + 2];
      bgN++;
    }
    if (useBgSeg) {
      var sx;
      for (sx = 0; sx < cw; sx += Math.max(1, (cw / 16) | 0)) {
        sampleBg(sx, 0);
        sampleBg(sx, ch - 1);
      }
      for (sx = 0; sx < ch; sx += Math.max(1, (ch / 16) | 0)) {
        sampleBg(0, sx);
        sampleBg(cw - 1, sx);
      }
      if (bgN > 0) {
        bgR /= bgN;
        bgG /= bgN;
        bgB /= bgN;
      }
    }
    function pixelWeight(pIndex) {
      var a = px[pIndex + 3];
      if (!useBgSeg) return a >= 28 ? a : 0;
      var dr = px[pIndex] - bgR;
      var dg = px[pIndex + 1] - bgG;
      var db = px[pIndex + 2] - bgB;
      var dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < 34) return 0;
      return Math.min(255, (dist - 28) * 3.2);
    }
    var sumW = 0;
    var sumX = 0;
    var sumY = 0;
    for (i = 0; i < px.length; i += 4) {
      var a = pixelWeight(i);
      if (a <= 0) continue;
      var p = (i / 4) | 0;
      x = p % cw;
      y = (p / cw) | 0;
      sumW += a;
      sumX += x * a;
      sumY += y * a;
    }
    if (sumW < 1) return 0;
    var cx = sumX / sumW;
    var cy = sumY / sumW;
    // 先尝试“喷口蓝焰法”推断机尾方向：对这类战机素材比几何轮廓更稳定
    var engineW = 0;
    var engineX = 0;
    var engineY = 0;
    for (i = 0; i < px.length; i += 4) {
      var ew = pixelWeight(i);
      if (ew <= 0) continue;
      var br = px[i];
      var bg = px[i + 1];
      var bb = px[i + 2];
      // 蓝焰/引擎常见特征：蓝通道显著高，且饱和度高
      if (bb < 110) continue;
      if (bb < br + 22 || bb < bg + 10) continue;
      var cool = bb - (br + bg) * 0.5;
      if (cool < 20) continue;
      var ep = (i / 4) | 0;
      x = ep % cw;
      y = (ep / cw) | 0;
      var weight = ew * (0.4 + Math.min(2.2, cool / 52));
      engineW += weight;
      engineX += x * weight;
      engineY += y * weight;
    }
    if (engineW > sumW * 0.012) {
      var ex = engineX / engineW;
      var ey = engineY / engineW;
      // forward = 机身中心 - 引擎中心（机头与喷口方向相反）
      var fx = cx - ex;
      var fy = cy - ey;
      var fl = Math.sqrt(fx * fx + fy * fy);
      if (fl > 4) {
        fx /= fl;
        fy /= fl;
        var er = Math.atan2(-fx, -fy);
        if (isFinite(er)) {
          var ed = (er * 180) / Math.PI;
          if (ed > 180) ed -= 360;
          if (ed < -180) ed += 360;
          return ed;
        }
      }
    }
    var xx = 0;
    var yy = 0;
    var xy = 0;
    for (i = 0; i < px.length; i += 4) {
      a = pixelWeight(i);
      if (a <= 0) continue;
      p = (i / 4) | 0;
      x = p % cw;
      y = (p / cw) | 0;
      var dx = x - cx;
      var dy = y - cy;
      xx += a * dx * dx;
      yy += a * dy * dy;
      xy += a * dx * dy;
    }
    var axisA = 0.5 * Math.atan2(2 * xy, xx - yy);
    var ax = Math.cos(axisA);
    var ay = Math.sin(axisA);
    var posSpread = 0;
    var posW = 0;
    var negSpread = 0;
    var negW = 0;
    var axisLen = Math.max(1, Math.sqrt(xx / sumW + yy / sumW));
    var nearEnd = axisLen * 0.28;
    for (i = 0; i < px.length; i += 4) {
      a = pixelWeight(i);
      if (a <= 0) continue;
      p = (i / 4) | 0;
      x = p % cw;
      y = (p / cw) | 0;
      dx = x - cx;
      dy = y - cy;
      var t = dx * ax + dy * ay;
      var n = dx * -ay + dy * ax;
      if (t > nearEnd) {
        posSpread += a * n * n;
        posW += a;
      } else if (t < -nearEnd) {
        negSpread += a * n * n;
        negW += a;
      }
    }
    var posWidth = posW > 0 ? Math.sqrt(posSpread / posW) : 9999;
    var negWidth = negW > 0 ? Math.sqrt(negSpread / negW) : 9999;
    // 细的一端通常是机头；据此确定“向前”方向
    var nx = posWidth <= negWidth ? ax : -ax;
    var ny = posWidth <= negWidth ? ay : -ay;
    // 把机头旋到屏幕上方（0,-1）
    var rad = Math.atan2(-nx, -ny);
    if (!isFinite(rad)) return 0;
    var deg = (rad * 180) / Math.PI;
    // 抑制极端误判，避免出现突发大角度反转
    if (deg > 180) deg -= 360;
    if (deg < -180) deg += 360;
    if (Math.abs(deg) > 135) deg = deg > 0 ? deg - 180 : deg + 180;
    // 与上一帧静态基准一致性：避免在噪声图上跳转到错误象限
    if (Math.abs(deg - playerVisualAutoRollDeg) > 95 && Math.abs((deg > 0 ? deg - 180 : deg + 180) - playerVisualAutoRollDeg) < 55) {
      deg = deg > 0 ? deg - 180 : deg + 180;
    }
    return deg;
  }

  function getPlayerDirectionRollRad() {
    var autoDeg = PLAYER_VISUAL_USE_AUTO_CALIB ? playerVisualAutoRollDeg : 0;
    return ((PLAYER_VISUAL_FORCE_BASE_DEG + PLAYER_VISUAL_ROLL_FIX_DEG + autoDeg + PLAYER_VISUAL_CALIB_OFFSET_DEG) * Math.PI) / 180;
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scrubPlayerCyanMarker(im));
        playerVisualAutoRollDeg = calibratePlayerVisualBaseDeg(im);
        if (!isFinite(playerVisualAutoRollDeg)) playerVisualAutoRollDeg = 0;
        playerLoaded = true;
        playerUsesProceduralTex = false;
        console.log('[3D] 战机精灵贴图:', basePath, iw, ih, 'autoRollDeg=', playerVisualAutoRollDeg.toFixed(2));
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
  var playerClip = new Float32Array(4);
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
  function rgbFromHex(hex) {
    var s = (hex || '#000000').replace('#', '');
    if (s.length !== 6) return new Float32Array([0, 0, 0]);
    var r = parseInt(s.slice(0, 2), 16) / 255;
    var g = parseInt(s.slice(2, 4), 16) / 255;
    var b = parseInt(s.slice(4, 6), 16) / 255;
    return new Float32Array([r, g, b]);
  }
  var ENEMY_TYPE_CONFIGS = [
    { id: 'normal', highlight: rgbFromHex('#B3E5FC'), mid: rgbFromHex('#4FC3F7'), edge: rgbFromHex('#0288D1'), eye: rgbFromHex('#E3F2FD') },
    { id: 'fast', highlight: rgbFromHex('#FFE0B2'), mid: rgbFromHex('#FF9800'), edge: rgbFromHex('#E65100'), eye: rgbFromHex('#FFF3E0') },
    { id: 'zigzag', highlight: rgbFromHex('#F3E5F5'), mid: rgbFromHex('#CE93D8'), edge: rgbFromHex('#7B1FA2'), eye: rgbFromHex('#F8EAFB') },
    { id: 'tough', highlight: rgbFromHex('#FFE0B2'), mid: rgbFromHex('#EF6C00'), edge: rgbFromHex('#BF360C'), eye: rgbFromHex('#FFF2DF') }
  ];
  var ENEMY_BOSS_CONFIG = {
    id: 'boss',
    highlight: rgbFromHex('#FFEBEE'),
    mid: rgbFromHex('#FF1744'),
    edge: rgbFromHex('#7F0000'),
    eye: rgbFromHex('#FFFFFF')
  };
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
  var targetPlayerY = PLAYER_Y_DEFAULT;
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
  var bulletLevel = 1;
  var shieldTimer = 0;
  var combo = 0;
  var comboTimer = 0;
  var score = 0;
  var needScore = 35;
  var hp = 7;
  var MAX_HP = 7;
  var bossActive = false;
  var bossSpawnScore = 28;
  var bossDefeated = false;
  var bossShootCycle = 0;
  var drops = [];
  var dropSpawnT = 0;
  var enemyBallTextures = {};
  var enemyBulletTexNormal = null;
  var enemyBulletTexBoss = null;
  var powerupTexHeal = null;
  var powerupTexAtk = null;
  var powerupTexShield = null;
  var enemyBarPos = [0, 0];
  // 机身平衡微调（3D 下可稳定调平）
  // roll: 正值右高左低，负值左高右低（建议范围 -5 ~ 5）
  var playerRollTrimDeg = 0;
  // 机翼高度差：正值抬右压左，负值抬左压右
  var playerWingBalanceY = 0;
  var worldTravelX = 0;
  var gameOver = false;
  var gameStarted = false;
  var startAt = Date.now();
  var duration = 90;
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
    var x0 = (wi - 52) / wi * 2 - 1;
    var x1 = (wi - 12) / wi * 2 - 1;
    var yTop = 1 - (10 / hi) * 2;
    var yBot = 1 - (52 / hi) * 2;
    quad(x0, yBot, x1, yTop, 0.1, 0.12, 0.22, 0.82);
    var mx = (x0 + x1) / 2;
    var bw = (3 / wi) * 2;
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
    ctx.font = 'bold 46px sans-serif';
    ctx.strokeText('3D 随机闯关', 40, 28);
    ctx.fillText('3D 随机闯关', 40, 28);
    ctx.font = '30px sans-serif';
    ctx.fillStyle = 'rgba(212,222,244,0.9)';
    ctx.font = '24px sans-serif';
    ctx.fillStyle = 'rgba(184,196,224,0.88)';

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, 312);
    ctx.lineTo(UI_ATLAS_W - 24, 312);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,220,170,0.98)';
    ctx.font = 'bold 38px sans-serif';
    ctx.strokeText('游戏已暂停', 40, 338);
    ctx.fillText('游戏已暂停', 40, 338);
    ctx.fillStyle = 'rgba(218,226,248,0.94)';
    ctx.font = '30px sans-serif';
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
    ctx.font = 'bold ' + fontPx + 'px sans-serif';
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
    var rollFix = getPlayerDirectionRollRad();
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    drawUiTexture(playerTex, playerNdc.tx, playerNdc.ty, drawHw, drawHh, rollFix);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(pMesh);
  }

  function rgbToCss(rgb) {
    var rr = Math.max(0, Math.min(255, Math.round((rgb[0] || 0) * 255)));
    var gg = Math.max(0, Math.min(255, Math.round((rgb[1] || 0) * 255)));
    var bb = Math.max(0, Math.min(255, Math.round((rgb[2] || 0) * 255)));
    return 'rgb(' + rr + ',' + gg + ',' + bb + ')';
  }

  function buildEnemyBallTexture(cfg, key, isBoss) {
    var s = isBoss ? 320 : 220;
    var oc = wx.createOffscreenCanvas
      ? wx.createOffscreenCanvas({ type: '2d', width: s, height: s })
      : wx.createCanvas();
    oc.width = s;
    oc.height = s;
    var c2 = oc.getContext('2d');
    if (!c2) return;
    var cx = s * 0.5;
    var cy = s * 0.5;
    var r = s * 0.46;
    c2.clearRect(0, 0, s, s);
    c2.save();
    c2.shadowColor = rgbToCss(cfg.mid);
    c2.shadowBlur = isBoss ? 40 : 18;
    var grad = c2.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
    grad.addColorStop(0, rgbToCss(cfg.highlight));
    grad.addColorStop(isBoss ? 0.2 : 0.35, rgbToCss(cfg.highlight));
    grad.addColorStop(0.55, rgbToCss(cfg.mid));
    grad.addColorStop(1, rgbToCss(cfg.edge));
    c2.fillStyle = grad;
    c2.beginPath();
    c2.arc(cx, cy, r, 0, Math.PI * 2);
    c2.fill();
    c2.shadowBlur = 0;
    c2.strokeStyle = 'rgba(255,255,255,0.24)';
    c2.lineWidth = isBoss ? 4 : 2;
    c2.beginPath();
    c2.arc(cx - r * 0.14, cy - r * 0.14, r * 0.45, 0, Math.PI * 2);
    c2.stroke();
    c2.strokeStyle = 'rgba(0,0,0,0.16)';
    c2.lineWidth = isBoss ? 3 : 1.5;
    c2.beginPath();
    c2.arc(cx, cy, r * 0.68, 0, Math.PI * 2);
    c2.stroke();
    c2.fillStyle = '#FFFFFF';
    c2.beginPath();
    c2.arc(cx - r * 0.2, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
    c2.fill();
    c2.beginPath();
    c2.arc(cx + r * 0.2, cy - r * 0.1, r * 0.12, 0, Math.PI * 2);
    c2.fill();
    c2.fillStyle = '#111';
    c2.beginPath();
    c2.arc(cx - r * 0.18, cy - r * 0.08, r * 0.06, 0, Math.PI * 2);
    c2.fill();
    c2.beginPath();
    c2.arc(cx + r * 0.22, cy - r * 0.08, r * 0.06, 0, Math.PI * 2);
    c2.fill();
    c2.strokeStyle = '#000';
    c2.lineWidth = isBoss ? 4 : 2;
    c2.beginPath();
    c2.arc(cx, cy + r * 0.14, r * 0.14, 0, Math.PI);
    c2.stroke();
    c2.restore();

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    enemyBallTextures[key] = tex;
  }

  function buildEnemyBallTextures() {
    var i;
    for (i = 0; i < ENEMY_TYPE_CONFIGS.length; i++) {
      buildEnemyBallTexture(ENEMY_TYPE_CONFIGS[i], ENEMY_TYPE_CONFIGS[i].id, false);
    }
    buildEnemyBallTexture(ENEMY_BOSS_CONFIG, 'boss', true);
  }

  function buildEnemyBulletTexture(stops) {
    var s = 96;
    var oc = wx.createOffscreenCanvas
      ? wx.createOffscreenCanvas({ type: '2d', width: s, height: s })
      : wx.createCanvas();
    oc.width = s;
    oc.height = s;
    var c2 = oc.getContext('2d');
    if (!c2) return null;
    var cx = s * 0.5;
    var cy = s * 0.5;
    var r = s * 0.24;
    c2.clearRect(0, 0, s, s);
    var glow = c2.createRadialGradient(cx, cy, 0, cx, cy, r * 3.0);
    glow.addColorStop(0, stops.glow0);
    glow.addColorStop(0.5, stops.glow1);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c2.fillStyle = glow;
    c2.beginPath();
    c2.arc(cx, cy, r * 3.0, 0, Math.PI * 2);
    c2.fill();
    var core = c2.createRadialGradient(cx, cy, 0, cx, cy, r);
    core.addColorStop(0, '#FFFFFF');
    core.addColorStop(0.4, stops.mid);
    core.addColorStop(1, stops.edge);
    c2.fillStyle = core;
    c2.beginPath();
    c2.arc(cx, cy, r, 0, Math.PI * 2);
    c2.fill();

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    return tex;
  }

  function buildEnemyBulletTextures() {
    enemyBulletTexNormal = buildEnemyBulletTexture({
      glow0: 'rgba(255,50,50,0.42)',
      glow1: 'rgba(255,20,20,0.16)',
      mid: '#FF4444',
      edge: '#CC0000'
    });
    enemyBulletTexBoss = buildEnemyBulletTexture({
      glow0: 'rgba(255,120,255,0.5)',
      glow1: 'rgba(255,40,180,0.2)',
      mid: '#FF5EC8',
      edge: '#9C27B0'
    });
  }

  function buildPowerupTexture(kind) {
    var s = 196;
    var oc = wx.createOffscreenCanvas
      ? wx.createOffscreenCanvas({ type: '2d', width: s, height: s })
      : wx.createCanvas();
    oc.width = s;
    oc.height = s;
    var c2 = oc.getContext('2d');
    if (!c2) return null;
    var cx = s * 0.5;
    var cy = s * 0.44;
    var baseR = s * 0.18;
    var cfg =
      kind === 'heal'
        ? { glow: 'rgba(255,90,90,0.34)', mid: '#FF6B6B', edge: '#D84343', icon: '+', txt: '回血' }
        : kind === 'shield'
          ? { glow: 'rgba(120,190,255,0.34)', mid: '#64B5F6', edge: '#2A75C9', icon: 'S', txt: '护盾' }
          : { glow: 'rgba(255,210,80,0.34)', mid: '#FFD54F', edge: '#E69A00', icon: 'A', txt: '加攻' };
    c2.clearRect(0, 0, s, s);
    var glow = c2.createRadialGradient(cx, cy, 0, cx, cy, baseR * 2.6);
    glow.addColorStop(0, cfg.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c2.fillStyle = glow;
    c2.beginPath();
    c2.arc(cx, cy, baseR * 2.6, 0, Math.PI * 2);
    c2.fill();
    var core = c2.createRadialGradient(cx - baseR * 0.25, cy - baseR * 0.25, baseR * 0.1, cx, cy, baseR);
    core.addColorStop(0, '#FFFFFF');
    core.addColorStop(0.45, cfg.mid);
    core.addColorStop(1, cfg.edge);
    c2.fillStyle = core;
    c2.beginPath();
    c2.arc(cx, cy, baseR, 0, Math.PI * 2);
    c2.fill();
    c2.strokeStyle = 'rgba(255,255,255,0.38)';
    c2.lineWidth = 2;
    c2.beginPath();
    c2.arc(cx - baseR * 0.16, cy - baseR * 0.16, baseR * 0.42, 0, Math.PI * 2);
    c2.stroke();
    c2.fillStyle = '#FFFFFF';
    c2.font = 'bold 36px sans-serif';
    c2.textAlign = 'center';
    c2.textBaseline = 'middle';
    c2.fillText(cfg.icon, cx, cy + 1);
    c2.fillStyle = cfg.mid;
    c2.font = 'bold 20px sans-serif';
    c2.fillText(cfg.txt, cx, cy + baseR + 22);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oc);
    return tex;
  }

  function buildPowerupTextures() {
    powerupTexHeal = buildPowerupTexture('heal');
    powerupTexAtk = buildPowerupTexture('atk');
    powerupTexShield = buildPowerupTexture('shield');
  }

  buildUiAtlasTexture();
  buildHomeButtonLabelTextures();
  buildEnemyBallTextures();
  buildEnemyBulletTextures();
  buildPowerupTextures();

  function spawnEnemy() {
    if (bossActive) return;
    var progress = gameStarted ? Math.min(1, score / needScore) : 0;
    var hasTaunt = Math.random() < 0.34;
    spawnCount++;
    var isElite = spawnCount % 8 === 0;
    var enemyRadius = (isElite ? 0.72 : 0.56) + Math.random() * (isElite ? 0.12 : 0.1);
    var hpBase = isElite ? 3 : 1;
    var typeCfg = ENEMY_TYPE_CONFIGS[(Math.random() * ENEMY_TYPE_CONFIGS.length) | 0];
    enemies.push({
      x: playerX + (Math.random() * 2 - 1) * 3.0,
      z: -10 - Math.random() * 2.2,
      y: playerY + (Math.random() * 2 - 1) * 0.45 + 0.06,
      speed: (isElite ? 2.2 : 2.7) + progress * (isElite ? 1.5 : 2.1) + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      gait: Math.random() * Math.PI * 2,
      shootT: Math.random() * 0.9,
      shootInterval: (isElite ? 0.8 : 1.05) + Math.random() * (isElite ? 0.38 : 0.7),
      r: enemyRadius,
      hp: hpBase,
      hpMax: hpBase,
      elite: isElite,
      enemyType: typeCfg.id,
      color: typeCfg.mid,
      maskColor: typeCfg.edge,
      eyeColor: typeCfg.eye,
      highlightColor: typeCfg.highlight,
      midColor: typeCfg.mid,
      edgeColor: typeCfg.edge,
      flashT: 0,
      taunt: hasTaunt ? enemyTaunts[(Math.random() * enemyTaunts.length) | 0] : ''
    });
    if (hasTaunt && tauntCooldown <= 0) {
      tauntCooldown = 2.2;
      wx.showToast({ title: enemies[enemies.length - 1].taunt, icon: 'none', duration: 900 });
    }
  }

  function spawnBoss() {
    enemies.push({
      x: playerX,
      y: playerY + 0.32,
      z: -12.5,
      speed: 1.45,
      phase: 0,
      gait: 0,
      shootT: 0,
      shootInterval: 0.55,
      r: 2.25,
      hp: 140,
      hpMax: 140,
      elite: true,
      boss: true,
      color: new Float32Array([0.45, 0.12, 0.8]),
      maskColor: rgbFromHex('#8E0000'),
      eyeColor: rgbFromHex('#FFEBEE'),
      highlightColor: rgbFromHex('#FFEBEE'),
      midColor: rgbFromHex('#FF1744'),
      edgeColor: rgbFromHex('#7F0000'),
      flashT: 0,
      taunt: 'Boss 入场：深渊母舰'
    });
    bossActive = true;
    bossShootCycle = 0;
    wx.showToast({ title: 'Boss 出现！', icon: 'none', duration: 900 });
  }

  function spawnDrop(x, y, z, kind) {
    drops.push({
      x: x,
      y: y,
      z: z,
      kind: kind,
      life: 12.0,
      phase: Math.random() * Math.PI * 2
    });
    if (drops.length > 18) drops.splice(0, drops.length - 18);
  }

  function maybeDropFromEnemy(e) {
    if (e && e.boss) {
      spawnDrop(e.x, e.y, e.z, 'atk');
      spawnDrop(e.x + 0.35, e.y, e.z - 0.2, 'heal');
      spawnDrop(e.x - 0.35, e.y, e.z - 0.2, 'shield');
      return;
    }
    var r = Math.random();
    if (r < 0.34) spawnDrop(e.x, e.y, e.z, 'atk');
    else if (r < 0.5) spawnDrop(e.x, e.y, e.z, 'heal');
    else if (r < 0.64) spawnDrop(e.x, e.y, e.z, 'shield');
  }

  function applyDrop(kind) {
    if (kind === 'atk') {
      powerTimer = Math.max(powerTimer, 0) + 5.5;
      bulletLevel = Math.min(5, bulletLevel + 1);
      wx.showToast({ title: '火力升级 Lv.' + bulletLevel, icon: 'none', duration: 650 });
    } else if (kind === 'heal') {
      hp = Math.min(MAX_HP, hp + 1);
      wx.showToast({ title: '生命 +1', icon: 'none', duration: 500 });
    } else if (kind === 'shield') {
      shieldTimer = Math.max(shieldTimer, 0) + 5.5;
      wx.showToast({ title: '护盾 +5.5s', icon: 'none', duration: 500 });
    }
  }

  function chooseAimTarget(x, y, z) {
    var best = null;
    var bestScore = 1e9;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var dx = e.x - x;
      var dy = e.y - y;
      var dz = e.z - z;
      if (dz > 1.5) continue;
      var threat = e.boss ? -1.1 : (e.elite ? -0.35 : 0);
      var distScore = dx * dx * 1.25 + dy * dy + dz * dz * 0.25 + threat;
      if (distScore < bestScore) {
        bestScore = distScore;
        best = e;
      }
    }
    return best;
  }

  function readTouchClientPos(touch) {
    // 真机优先使用窗口坐标系字段；touch.x/y 为相对 canvas 左上角，需换算到窗口
    var x = touch.clientX;
    if (x === undefined || x === null) x = touch.pageX;
    if (x === undefined || x === null) x = touch.screenX;
    if (x === undefined || x === null) x = touch.rawX;
    var xFromCanvas = false;
    if (x === undefined || x === null) {
      x = touch.x;
      xFromCanvas = x !== undefined && x !== null;
    }
    if (x === undefined || x === null) x = 0;
    var y = touch.clientY;
    if (y === undefined || y === null) y = touch.pageY;
    if (y === undefined || y === null) y = touch.screenY;
    if (y === undefined || y === null) y = touch.rawY;
    var yFromCanvas = false;
    if (y === undefined || y === null) {
      y = touch.y;
      yFromCanvas = y !== undefined && y !== null;
    }
    if (y === undefined || y === null) y = h * 0.5;
    if (xFromCanvas && renderW > 0) x = x * (windowW / renderW);
    if (yFromCanvas && renderH > 0) y = y * (windowH / renderH);
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
    // 禁止把 [0,1] 像素误判为「归一化坐标」：例如 clientY===1 会被当成 y=1 再乘满屏高度，战机瞬间贴底
    if (!isFinite(x) || !isFinite(y)) return null;
    return {
      x: Math.max(0, Math.min(inputW, x)),
      y: Math.max(0, Math.min(inputH, y))
    };
  }

  function projectNdcX(x, y, z) {
    var cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
    var cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (!isFinite(cx) || !isFinite(cw) || Math.abs(cw) < 1e-5) return null;
    return cx / cw;
  }

  function projectScreenPos(out, x, y, z) {
    var cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
    var cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
    var cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
    if (!isFinite(cx) || !isFinite(cy) || !isFinite(cw) || Math.abs(cw) < 1e-5) return false;
    var ndcX = cx / cw;
    var ndcY = cy / cw;
    if (ndcX < -1.2 || ndcX > 1.2 || ndcY < -1.2 || ndcY > 1.2) return false;
    out[0] = (ndcX * 0.5 + 0.5) * renderW;
    out[1] = (ndcY * 0.5 + 0.5) * renderH;
    return true;
  }

  function clampPlayerXToScreen(px, py, pz) {
    var hardMin = -PLAYER_X_LIMIT;
    var hardMax = PLAYER_X_LIMIT;
    var edgeNdc = 0.82; // 给战机体积预留边距，避免机翼出屏
    var lLo = hardMin;
    var lHi = hardMax;
    var i;
    for (i = 0; i < 14; i++) {
      var mxL = (lLo + lHi) * 0.5;
      var ndcL = projectNdcX(mxL, py, pz);
      if (ndcL === null || ndcL < -edgeNdc) {
        lLo = mxL;
      } else {
        lHi = mxL;
      }
    }
    var minVis = lLo;
    var rLo = hardMin;
    var rHi = hardMax;
    for (i = 0; i < 14; i++) {
      var mxR = (rLo + rHi) * 0.5;
      var ndcR = projectNdcX(mxR, py, pz);
      if (ndcR === null || ndcR > edgeNdc) {
        rHi = mxR;
      } else {
        rLo = mxR;
      }
    }
    var maxVis = rLo;
    if (!isFinite(minVis) || !isFinite(maxVis) || minVis > maxVis) {
      return Math.max(-PLAYER_X_LIMIT, Math.min(PLAYER_X_LIMIT, px));
    }
    return Math.max(minVis, Math.min(maxVis, px));
  }

  var pointerDragging = false;
  var pointerMoved = false;
  var pointerStartX = 0;
  var pointerStartY = 0;
var dragAnchorPlayerX = 0;
var dragAnchorPlayerY = 0;
  var _lastPointerDebugTs = 0;
  var DRAG_START_THRESHOLD_PX = 8;

  function setTargetsFromPointer(np, inputW, inputH) {
    // 相对拖动：避免首帧坐标异常导致“按下即触底/飞出屏幕”
    var dx = np.x - pointerStartX;
    var dy = np.y - pointerStartY;
    var nextX = dragAnchorPlayerX + (dx / inputW) * 8.0;
    var nextY = dragAnchorPlayerY - (dy / inputH) * 3.0;
    targetPlayerX = Math.max(-PLAYER_X_LIMIT, Math.min(PLAYER_X_LIMIT, nextX));
    targetPlayerY = Math.max(PLAYER_Y_MIN, Math.min(PLAYER_Y_MAX, nextY));
    targetPlayerZ = PLAYER_Z_DEFAULT;
  }

  function updatePlayerTargetFromPointer(p) {
    var np = normalizePointerToWindow(p);
    if (!np) return;
    var inputW = Math.max(1, windowW);
    var inputH = Math.max(1, windowH);
    if (!pointerDragging) pointerDragging = true;
    if (!pointerMoved) {
      var ddx = np.x - pointerStartX;
      var ddy = np.y - pointerStartY;
      if (ddx * ddx + ddy * ddy < DRAG_START_THRESHOLD_PX * DRAG_START_THRESHOLD_PX) {
        return;
      }
      pointerMoved = true;
    }
    setTargetsFromPointer(np, inputW, inputH);
    var nowDbg = Date.now();
    if (nowDbg - _lastPointerDebugTs > 250) {
      _lastPointerDebugTs = nowDbg;
      console.log('[3D] pos:', targetPlayerX.toFixed(2), targetPlayerY.toFixed(2));
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
    if (typeof wx.onMouseDown === 'function') {
    wx.onMouseDown(function(e) {
      if (gameOver || !gameStarted || paused) return;
      var p = readPointerPosFromEvent(e);
      if (!p) return;
      if (p.x > w - 56 && p.y < 56) return;
      var np = normalizePointerToWindow(p);
      if (np) {
        pointerDragging = true;
        pointerMoved = false;
        pointerStartX = np.x;
        pointerStartY = np.y;
        dragAnchorPlayerX = playerX;
        dragAnchorPlayerY = playerY;
      }
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
            '拖动屏幕：左右控制横移，上下控制战机在屏幕中的高度（伪3D轨道逻辑）。\n战机Z轴固定，前进感由场景/敌机速度变化和视差提供。\n自动发射子弹；击落敌人得分；敌人突破防线会扣血。\n最终目标：击毁最终 Boss 即通关（分数仅用于成长/掉落节奏）。\n右上角可暂停/继续。',
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
    if (gameStarted && !gameOver && x > w - 56 && y < 56) {
      paused = true;
      return;
    }
    if (gameOver) return;
    // 开始拖动
    var np = normalizePointerToWindow(p);
    if (np) {
      pointerDragging = true;
      pointerMoved = false;
      pointerStartX = np.x;
      pointerStartY = np.y;
      dragAnchorPlayerX = playerX;
      dragAnchorPlayerY = playerY;
    }
    return;
  });
  wx.onTouchEnd(function() {
    pointerDragging = false;
    pointerMoved = false;
  });
  wx.onTouchCancel(function() {
    pointerDragging = false;
    pointerMoved = false;
  });

  function bindMesh(buf) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(locMesh.pos, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(locMesh.nor, 3, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(locMesh.pos);
    gl.enableVertexAttribArray(locMesh.nor);
  }

  var ZERO3 = new Float32Array([0, 0, 0]);

  function drawMesh(buf, count, color, modelMat, emit, hot, addBurst, specPow, specStrength, rimStrength) {
    bindMesh(buf);
    mul4(tmp, view, modelMat);
    mul4(mvp, proj, tmp);
    n3From4(modelMat, n3);
    gl.uniformMatrix4fv(locMesh.mvp, false, mvp);
    if (locMesh.model) gl.uniformMatrix4fv(locMesh.model, false, modelMat);
    gl.uniformMatrix3fv(locMesh.n, false, n3);
    gl.uniform3fv(locMesh.light, LIGHT_DIR);
    if (locMesh.cam) gl.uniform3f(locMesh.cam, CAM_EX, CAM_EY, CAM_EZ);
    gl.uniform3fv(locMesh.rgb, color);
    if (locMesh.emit) gl.uniform1f(locMesh.emit, emit == null ? 0 : emit);
    if (locMesh.hot) gl.uniform3fv(locMesh.hot, hot || ZERO3);
    if (locMesh.addBurst) gl.uniform1f(locMesh.addBurst, addBurst == null ? 0 : addBurst);
    if (locMesh.specPow) gl.uniform1f(locMesh.specPow, specPow == null ? 18 : specPow);
    if (locMesh.specStrength) gl.uniform1f(locMesh.specStrength, specStrength == null ? 0.08 : specStrength);
    if (locMesh.rimStrength) gl.uniform1f(locMesh.rimStrength, rimStrength == null ? 0.06 : rimStrength);
    gl.drawArrays(gl.TRIANGLES, 0, count);
  }

  function composePart(base, ox, oy, oz, sx, sy, sz, out) {
    translate4(tmp, ox, oy, oz);
    scale4(tmp2, sx, sy, sz);
    mul4(tmp3, tmp, tmp2);
    mul4(out, base, tmp3);
  }

  function billboardFacingCamera(cx, cy, cz, directionRad, balanceShear, outR, outU) {
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
    var cr = Math.cos(directionRad);
    var sr = Math.sin(directionRad);
    var fvx = rx * cr + ux * sr;
    var fvy = ry * cr + uy * sr;
    var fvz = rz * cr + uz * sr;
    var fux = -rx * sr + ux * cr;
    var fuy = -ry * sr + uy * cr;
    var fuz = -rz * sr + uz * cr;
    if (Math.abs(balanceShear) > 1e-6) {
      fux += fvx * balanceShear;
      fuy += fvy * balanceShear;
      fuz += fvz * balanceShear;
      var ul = Math.sqrt(fux * fux + fuy * fuy + fuz * fuz);
      if (ul > 1e-6) {
        fux /= ul;
        fuy /= ul;
        fuz /= ul;
      }
    }
    outR[0] = fvx;
    outR[1] = fvy;
    outR[2] = fvz;
    outU[0] = fux;
    outU[1] = fuy;
    outU[2] = fuz;
  }

  // 玩家战机使用“屏幕稳定”朝向基底，避免左右移动时因相机-物体向量变化产生视觉倾斜
  function billboardFacingView(directionRad, balanceShear, outR, outU) {
    var rx = view[0];
    var ry = view[4];
    var rz = view[8];
    var ux = view[1];
    var uy = view[5];
    var uz = view[9];
    var rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    var ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    rx /= rl; ry /= rl; rz /= rl;
    ux /= ul; uy /= ul; uz /= ul;
    var cr = Math.cos(directionRad);
    var sr = Math.sin(directionRad);
    var fvx = rx * cr + ux * sr;
    var fvy = ry * cr + uy * sr;
    var fvz = rz * cr + uz * sr;
    var fux = -rx * sr + ux * cr;
    var fuy = -ry * sr + uy * cr;
    var fuz = -rz * sr + uz * cr;
    if (Math.abs(balanceShear) > 1e-6) {
      fux += fvx * balanceShear;
      fuy += fvy * balanceShear;
      fuz += fvz * balanceShear;
      ul = Math.sqrt(fux * fux + fuy * fuy + fuz * fuz);
      if (ul > 1e-6) {
        fux /= ul;
        fuy /= ul;
        fuz /= ul;
      }
    }
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
    // 缩小战机体积，减少遮挡并提升可视边界余量
    scale4(tmp, 0.45 * zScale, 0.45 * zScale, 0.45 * zScale);
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
      (playerBank * 0.14 + Math.sin(nowMs * 0.003) * 0.01 + (playerRollTrimDeg * Math.PI) / 180) * PLAYER_VISUAL_DYNAMIC_ROLL_GAIN +
      getPlayerDirectionRollRad();
    // 玩家战机前景优先，避免被大背景模型遮挡到“看不见”
    gl.disable(gl.DEPTH_TEST);
    if (ENABLE_PLAYER_BILLBOARD && playerLoaded) {
      billboardFacingView(rollRad, PLAYER_VISUAL_BALANCE_SHEAR, billRight, billUp);
      var halfW = Math.max(0.92, playerUsesProceduralTex ? 1.0 : 0.96) * (0.72 + z01 * 0.62) * 0.5;
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
      gl.uniform1f(locBill.chromaOn, 1.0);
      gl.uniform3f(locBill.chromaKey, 0.33, 0.86, 0.95);
      gl.uniform1f(locBill.chromaThreshold, 0.28);
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
    // 贴图成功时以贴图为主；仅在贴图不可用时回退实体机身
    if (!ENABLE_PLAYER_BILLBOARD || !playerLoaded) {
      drawPlayerCubes(nowMs);
    }
    // remove debug beacon/glow block: it appears as a cyan rectangle on top of the fighter texture
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

  function drawEnemyEmoji(e, nowMs, idx) {
    var er = e.r || 0.42;
    var sc = (e.boss ? 1.26 : 1.0) * (1 + Math.sin(nowMs * 0.005 + idx) * 0.04);
    var halfW = er * sc;
    var halfH = er * sc;
    if (e.boss) {
      // 防止 Boss 因透视靠近时“膨胀”到超出屏幕
      halfW = Math.min(1.05, halfW);
      halfH = Math.min(1.05, halfH);
    }
    var tex = enemyBallTextures[e.boss ? 'boss' : (e.enemyType || 'normal')];
    if (!tex) {
      tex = enemyBallTextures.normal;
    }
    billboardFacingCamera(e.x, e.y, e.z, 0, 0, billRight, billUp);
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
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(locBill.tex, 0);
    gl.uniform1f(locBill.chromaOn, 0.0);
    gl.uniform3f(locBill.center, e.x, e.y, e.z);
    gl.uniform3fv(locBill.right, billRight);
    gl.uniform3fv(locBill.up, billUp);
    gl.uniform1f(locBill.halfW, halfW);
    gl.uniform1f(locBill.halfH, halfH);
    gl.uniformMatrix4fv(locBill.mvp, false, vp);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.useProgram(pMesh);
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
    drops = [];
    muzzleFx = [];
    playerX = 0;
    targetPlayerX = 0;
    playerY = PLAYER_Y_DEFAULT;
    targetPlayerY = PLAYER_Y_DEFAULT;
    playerZ = PLAYER_Z_DEFAULT;
    targetPlayerZ = PLAYER_Z_DEFAULT;
    playerBank = 0;
    worldTravelX = 0;
    spawnT = 0;
    fireT = 0;
    bgChangeTimer = 0;
    mapChunkCooldown = 0;
    lastMapChunkIx = 0;
    lastMapChunkIy = 0;
    score = 0;
    hp = MAX_HP;
    bulletLevel = 1;
    shieldTimer = 0;
    bossActive = false;
    bossDefeated = false;
    bossShootCycle = 0;
    dropSpawnT = 0;
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
      content: win
        ? '恭喜！你已击毁最终 Boss。\n最终得分: ' + score
        : '本局未能击毁最终 Boss。\n最终得分: ' + score + '\n再试一次！',
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
    hp = MAX_HP;
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
    bulletLevel = 1;
    shieldTimer = 0;
    combo = 0;
    comboTimer = 0;
    bossActive = false;
    bossDefeated = false;
    bossShootCycle = 0;
    dropSpawnT = 0;
    gameOver = false;
    endedShown = false;
    paused = false;
    startAt = Date.now();
    bgChangeTimer = 0;
    mapChunkCooldown = 0;
    lastMapChunkIx = 0;
    lastMapChunkIy = 0;
    // 强制开局全景位（避免初始帧贴脸）
    playerY = PLAYER_Y_DEFAULT;
    targetPlayerY = PLAYER_Y_DEFAULT;
    playerZ = PLAYER_Z_DEFAULT;
    targetPlayerZ = PLAYER_Z_DEFAULT;
    worldTravelX = 0;
    
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

    bgPanT += dt * (gameStarted && !gameOver && !paused ? 1.85 : 1.0);
    homeFxT += dt;
    if (bgBlending) {
      bgBlend = Math.min(1, bgBlend + dt / bgBlendDuration);
      if (bgBlend >= 1) {
        bgCurrentTex = bgNextTex;
        bgBlending = false;
      }
    }

    persp(proj, Math.PI / 3.6, w / h, 0.1, 100);
    var camX = 0;
    var camLookY = 0.25;
    if (gameStarted) {
      // 屏幕内四向移动：横向固定镜头，保证左右位移可见
      camX = 0;
      // 纵向也固定镜头，避免相机跟随抵消“移动到顶部”的视觉效果
      camLookY = 0.25;
    }
    lookAt(view, camX, 5.7, 1.85, camX, camLookY, -6.6, 0, 1, 0);
    mul4(vp, proj, view);

    var starSpd = 2.8;
    var flowMul = 1.0;
    if (gameStarted && !gameOver && !paused) {
      // 战机越靠上，前进流速越高；越靠下，流速越低（雷霆战机式“推油门”体感）
      var y01Flow = (playerY - PLAYER_Y_MIN) / Math.max(0.001, (PLAYER_Y_MAX - PLAYER_Y_MIN));
      flowMul = 0.95 + y01Flow * 2.35;
      starSpd = 5.2 * flowMul;
    }
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
      shieldTimer = Math.max(0, shieldTimer - dt);
      comboTimer = Math.max(0, comboTimer - dt);
      if (combo > 0 && comboTimer <= 0) combo = 0;
      var smooth = 1.0;
      var prevX = playerX;
      playerX = targetPlayerX;
      playerY = targetPlayerY;
      targetPlayerZ = PLAYER_Z_DEFAULT;
      playerZ = targetPlayerZ;
      if (!isFinite(playerX) || !isFinite(playerY) || !isFinite(playerZ)) {
        playerX = 0;
        targetPlayerX = 0;
        playerY = PLAYER_Y_DEFAULT;
        targetPlayerY = PLAYER_Y_DEFAULT;
        playerZ = PLAYER_Z_DEFAULT;
        targetPlayerZ = PLAYER_Z_DEFAULT;
      }
      playerX = clampPlayerXToScreen(playerX, playerY, playerZ);
      targetPlayerX = clampPlayerXToScreen(targetPlayerX, targetPlayerY, targetPlayerZ);
      playerY = Math.max(PLAYER_Y_MIN, Math.min(PLAYER_Y_MAX, playerY));
      targetPlayerY = Math.max(PLAYER_Y_MIN, Math.min(PLAYER_Y_MAX, targetPlayerY));
      playerZ = Math.max(PLAYER_Z_FAR, Math.min(Math.min(PLAYER_Z_NEAR, PLAYER_Z_SAFE_MAX), playerZ));
      targetPlayerZ = Math.max(PLAYER_Z_FAR, Math.min(Math.min(PLAYER_Z_NEAR, PLAYER_Z_SAFE_MAX), targetPlayerZ));
      // 不回环：按真实横向位移累计“世界里程”，用于地图区块刷新
      worldTravelX += playerX - prevX;
      // 关闭左右移动时的机身晃动（bank）
      playerBank = 0;
      spawnT += dt;
      fireT += dt;
      dropSpawnT += dt;
      bgChangeTimer += dt;
      mapChunkCooldown = Math.max(0, mapChunkCooldown - dt);
      var chunkIx = Math.floor(worldTravelX / 12);
      var chunkIy = Math.floor((playerY - PLAYER_Y_DEFAULT) / 18);
      if ((chunkIx !== lastMapChunkIx || chunkIy !== lastMapChunkIy) && mapChunkCooldown <= 0) {
        lastMapChunkIx = chunkIx;
        lastMapChunkIy = chunkIy;
        mapChunkCooldown = 2.8;
        bgIndex = Math.floor(Math.random() * battleBgFiles.length);
        loadBgAtIndex(bgIndex);
      }
      if (bgChangeTimer >= bgChangeInterval) {
        bgChangeTimer = 0;
        bgIndex = Math.floor(Math.random() * battleBgFiles.length);
        loadBgAtIndex(bgIndex);
      }

      if (!bossActive && !bossDefeated && score >= bossSpawnScore) {
        spawnBoss();
      }

      var spawnInterval = Math.max(0.22, (0.58 - Math.min(1, score / needScore) * 0.2) / Math.max(0.68, flowMul));
      if (!bossActive && spawnT >= spawnInterval) {
        spawnT = 0;
        spawnEnemy();
      }
      if (!bossActive && powerTimer < 1.2 && dropSpawnT >= 8.5) {
        dropSpawnT = 0;
        spawnDrop(playerX + (Math.random() * 2 - 1) * 1.8, playerY + 0.4, -8.5, 'atk');
      }
      var fireInterval = bulletLevel >= 4 ? 0.046 : (bulletLevel >= 2 ? 0.06 : (powerTimer > 0 ? 0.055 : 0.09));
      if (fireT >= fireInterval) {
        fireT = 0;
        // 世界坐标直接出弹：NDC 反投影与机体 playerY 不同步时，弹道路径与敌人 e.x/e.y/e.z 不一致，导致“打中无反应”
        var bz = playerZ - 0.22;
        var wingW = 0.52;
        var baseY = playerY - 0.02;
        var shotOffsets = [-wingW, wingW];
        if (bulletLevel >= 2) {
          shotOffsets.push(-0.24, 0.24);
        }
        if (bulletLevel >= 4) {
          shotOffsets.push(-0.86, 0.86);
        }
        var so;
        for (so = 0; so < shotOffsets.length; so++) {
          var sx = playerX + shotOffsets[so];
          bullets.push({
            x: sx,
            y: baseY + Math.abs(shotOffsets[so]) * 0.02,
            z: bz,
            vx: 0,
            vy: 0,
            p: bulletLevel >= 2 || powerTimer > 0 ? 1 : 0,
            seed: Math.random() * 6.28318
          });
          var tS = chooseAimTarget(sx, baseY, bz);
          if (tS) {
            bullets[bullets.length - 1].vx = (tS.x - sx) * (bulletLevel >= 4 ? 1.55 : 1.3);
            bullets[bullets.length - 1].vy = (tS.y - baseY) * (bulletLevel >= 4 ? 1.28 : 1.1);
          }
        }
        if (bullets.length > 220) bullets.splice(0, bullets.length - 220);
        for (so = 0; so < shotOffsets.length; so++) {
          muzzleFx.push({ x: playerX + shotOffsets[so], y: baseY, z: bz + 0.04, life: 0.11 });
        }
        if (muzzleFx.length > 36) muzzleFx.splice(0, muzzleFx.length - 36);
      }

      for (i = muzzleFx.length - 1; i >= 0; i--) {
        muzzleFx[i].life -= dt;
        if (muzzleFx[i].life <= 0) muzzleFx.splice(i, 1);
      }

      for (i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += (bullets[i].vx || 0) * dt;
        bullets[i].y += (bullets[i].vy || 0) * dt;
        bullets[i].z -= 14 * dt;
        if (bullets[i].z < -13) bullets.splice(i, 1);
      }

      for (i = enemies.length - 1; i >= 0; i--) {
        enemies[i].phase += dt * 2.2;
        enemies[i].gait += dt * (4.2 + enemies[i].speed * 0.22);
        enemies[i].flashT = Math.max(0, (enemies[i].flashT || 0) - dt);
        enemies[i].y += Math.sin(enemies[i].phase) * 0.0016;
        if (enemies[i].boss) {
          enemies[i].x += Math.sin(now * 0.0016 + i) * 0.9 * dt;
          enemies[i].y += Math.cos(now * 0.0011 + i) * 0.6 * dt;
          enemies[i].x = Math.max(-3.6, Math.min(3.6, enemies[i].x));
          enemies[i].y = Math.max(-1.3, Math.min(1.9, enemies[i].y));
        } else {
          // 普通目标轻微回中，避免从中间一路漂移到屏幕外
          enemies[i].x += (playerX - enemies[i].x) * dt * 0.26;
          enemies[i].x = Math.max(-3.4, Math.min(3.4, enemies[i].x));
          enemies[i].y = Math.max(-1.55, Math.min(1.85, enemies[i].y));
        }
        enemies[i].shootT += dt;
        if (enemies[i].shootT >= enemies[i].shootInterval) {
          enemies[i].shootT = 0;
          if (enemies[i].boss) {
            var ringN = 7;
            bossShootCycle++;
            var gapIndex = bossShootCycle % ringN; // 始终保留一个缺口：可躲避但窗口有限
            var bsi;
            for (bsi = 0; bsi < ringN; bsi++) {
              if (bsi === gapIndex) continue;
              var ang = (Math.PI * 2 * bsi) / ringN + bossShootCycle * 0.28;
              var bossSpeed = 5.4 + Math.random() * 0.7;
              enemyBullets.push({
                x: enemies[i].x + Math.cos(ang) * 0.15,
                y: enemies[i].y + Math.sin(ang) * 0.08,
                z: enemies[i].z + (enemies[i].r || 0.42) * 0.6,
                vx: Math.cos(ang) * 1.25 + (playerX - enemies[i].x) * 0.12,
                vy: Math.sin(ang) * 1.02 + (playerY - enemies[i].y) * 0.14,
                vz: bossSpeed,
                kind: 'boss',
                life: 3.0,
                pulse: Math.random() * 6.28318
              });
            }
            // 间歇三连瞄准：提高压迫感，但间歇出现，仍可读可躲
            if (bossShootCycle % 2 === 0) {
              var baseVX = (playerX - enemies[i].x) * 0.36;
              var baseVY = (playerY - enemies[i].y) * 0.34;
              var spread;
              for (spread = -1; spread <= 1; spread++) {
                enemyBullets.push({
                  x: enemies[i].x + spread * 0.18,
                  y: enemies[i].y + 0.04,
                  z: enemies[i].z + (enemies[i].r || 0.42) * 0.58,
                  vx: baseVX + spread * 0.36,
                  vy: baseVY + spread * 0.22,
                  vz: 6.0,
                  kind: 'boss',
                  life: 2.3,
                  pulse: Math.random() * 6.28318
                });
              }
            }
          } else {
            enemyBullets.push({
              x: enemies[i].x,
              y: enemies[i].y,
              z: enemies[i].z + (enemies[i].r || 0.42) * 0.6,
              vx: (playerX - enemies[i].x) * 0.2,
              vy: (playerY - enemies[i].y) * 0.28,
              vz: 4.8 + Math.random() * 1.0,
              kind: 'normal',
              life: 2.2,
              pulse: Math.random() * 6.28318
            });
          }
          if (enemyBullets.length > 320) enemyBullets.splice(0, enemyBullets.length - 320);
        }
        if (enemies[i].boss) {
          // Boss 保持在中远景作战位，不再向镜头持续逼近导致体积失控
          var bossFightZ = -7.0;
          enemies[i].z += (bossFightZ - enemies[i].z) * dt * 0.9;
          enemies[i].z = Math.max(-10.5, Math.min(-5.8, enemies[i].z));
        } else {
          enemies[i].z += enemies[i].speed * dt * flowMul * 0.66;
        }
        if (!enemies[i].boss && enemies[i].z > 2.6) {
          hp -= enemies[i].boss ? 0.7 : 0.4;
          enemies.splice(i, 1);
          if (bossActive && hp > 0 && enemies.length === 0) bossActive = false;
          if (hp <= 0) endGame(false);
        }
      }

      for (i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].life -= dt;
        enemyBullets[i].x += enemyBullets[i].vx * dt;
        enemyBullets[i].y += (enemyBullets[i].vy || 0) * dt;
        enemyBullets[i].z += enemyBullets[i].vz * dt;
        if (enemyBullets[i].life <= 0 || enemyBullets[i].z > 1.3) {
          enemyBullets.splice(i, 1);
          continue;
        }
        var pdx = enemyBullets[i].x - playerX;
        var pdy = enemyBullets[i].y - playerY;
        var pdz = enemyBullets[i].z - playerZ;
        if (pdx * pdx + pdy * pdy * 1.35 + pdz * pdz < 0.09) {
          enemyBullets.splice(i, 1);
          hp -= shieldTimer > 0 ? 0.15 : 0.45;
          if (hp <= 0) endGame(false);
        }
      }

      for (i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        d.life -= dt;
        d.phase += dt * 5.2;
        d.z += 2.2 * dt * flowMul;
        d.y += Math.sin(d.phase) * 0.0065;
        if (d.life <= 0 || d.z > 1.4) {
          drops.splice(i, 1);
          continue;
        }
        var ddx = d.x - playerX;
        var ddy = d.y - playerY;
        var ddz = d.z - playerZ;
        if (ddx * ddx + ddy * ddy + ddz * ddz < 0.42) {
          applyDrop(d.kind);
          drops.splice(i, 1);
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
          // 略放大判定球 + 对称距离：原 dy*1.25 易漏检；高速弹单帧位移大时加 z 宽容度防穿模漏判
          var hitR = (e.r || 0.42) * 1.18 + 0.42;
          if (dx * dx + dy * dy + dz * dz < hitR * hitR) {
            bullets.splice(j, 1);
            hit = true;
            e.hp -= e.boss ? 0.4 : 1;
            e.flashT = 0.08;
            break;
          }
        }
        if (hit && e.hp <= 0) {
          var scoreGain = e.boss ? 14 : (e.elite ? 3 : 1);
          combo = Math.min(60, combo + 1);
          comboTimer = 2.2;
          var mul = 1 + Math.min(4, (combo / 10) | 0) * 0.2;
          enemies.splice(i, 1);
          score += Math.floor(scoreGain * mul);
          maybeDropFromEnemy(e);
          if (e.boss) {
            bossActive = false;
            bossDefeated = true;
            wx.showToast({ title: 'Boss 击破！', icon: 'none', duration: 900 });
          }
          if (e.elite) {
            powerTimer = Math.max(powerTimer, 6);
            wx.showToast({ title: '火力过载 +6s', icon: 'none', duration: 700 });
          } else if (combo > 0 && combo % 10 === 0) {
            wx.showToast({ title: '连击 x' + combo, icon: 'none', duration: 500 });
          }
        }
      }

      playerBank *= 0.7;
      if (bossDefeated) endGame(true);
      if (left <= 0 && !bossDefeated) endGame(false);
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
    var bgTexFrom = getBgTexture(bgCurrentTex);
    var bgTexTo = getBgTexture(bgBlending ? bgNextTex : bgCurrentTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTexFrom);
    gl.uniform1i(locBg.texA, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bgTexTo);
    gl.uniform1i(locBg.texB, 1);
    gl.uniform1f(locBg.blend, bgBlending ? bgBlend : 1);
    gl.uniform1f(locBg.mix, bgLoaded ? 0.94 : 0.0);
    // 首页轻微漂移；战斗中加大视差（仍限制在 clamp 内，用多频 sin 模拟纵深移动）
    var du;
    var dv;
    if (gameStarted && !gameOver) {
      du =
        Math.sin(bgPanT * 0.86) * 0.094 +
        Math.sin(bgPanT * 0.31) * 0.055 +
        Math.cos(bgPanT * 0.46) * 0.032 +
        Math.sin(worldTravelX * 0.068) * 0.118 +
        (playerY - PLAYER_Y_DEFAULT) * 0.03;
      dv =
        Math.cos(bgPanT * 0.76) * 0.104 +
        Math.sin(bgPanT * 0.43) * 0.058 +
        Math.sin(bgPanT * 0.22) * 0.038 +
        (playerY - PLAYER_Y_DEFAULT) * 0.034 -
        Math.cos(worldTravelX * 0.044) * 0.044;
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

    // 移除远景方块占位物，避免顶部出现“方块天体”伪影

    drawPlayer(now);

    for (i = 0; i < bullets.length; i++) {
      drawOneBullet(now, i);
    }
    for (i = 0; i < enemyBullets.length; i++) {
      var eb = enemyBullets[i];
      var isBossBullet = eb.kind === 'boss';
      var ep = 1 + Math.sin(now * 0.02 + (eb.pulse || 0)) * 0.14;
      var half = (isBossBullet ? 0.15 : 0.11) * ep;
      var bulletTex = isBossBullet ? enemyBulletTexBoss : enemyBulletTexNormal;
      if (!bulletTex) continue;
      billboardFacingCamera(eb.x, eb.y, eb.z, 0, 0, billRight, billUp);
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
      gl.bindTexture(gl.TEXTURE_2D, bulletTex);
      gl.uniform1i(locBill.tex, 0);
      gl.uniform1f(locBill.chromaOn, 0.0);
      gl.uniform3f(locBill.center, eb.x, eb.y, eb.z);
      gl.uniform3fv(locBill.right, billRight);
      gl.uniform3fv(locBill.up, billUp);
      gl.uniform1f(locBill.halfW, half);
      gl.uniform1f(locBill.halfH, half);
      gl.uniformMatrix4fv(locBill.mvp, false, vp);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.useProgram(pMesh);
    }
    for (i = 0; i < drops.length; i++) {
      var dk = drops[i].kind;
      var dPulse = 1 + Math.sin(now * 0.018 + i) * 0.08;
      var dHalf = 0.28 * dPulse;
      var dTex = dk === 'heal' ? powerupTexHeal : (dk === 'shield' ? powerupTexShield : powerupTexAtk);
      if (!dTex) continue;
      billboardFacingCamera(drops[i].x, drops[i].y, drops[i].z, 0, 0, billRight, billUp);
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
      gl.bindTexture(gl.TEXTURE_2D, dTex);
      gl.uniform1i(locBill.tex, 0);
      gl.uniform1f(locBill.chromaOn, 0.0);
      gl.uniform3f(locBill.center, drops[i].x, drops[i].y, drops[i].z);
      gl.uniform3fv(locBill.right, billRight);
      gl.uniform3fv(locBill.up, billUp);
      gl.uniform1f(locBill.halfW, dHalf);
      gl.uniform1f(locBill.halfH, dHalf);
      gl.uniformMatrix4fv(locBill.mvp, false, vp);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.useProgram(pMesh);
    }
    for (i = 0; i < enemies.length; i++) {
      drawEnemyEmoji(enemies[i], now, i);
    }

    drawPauseButtonInGame();

    if (gameStarted && !gameOver && !paused) {
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.SCISSOR_TEST);
      var hpRatio = Math.max(0, hp / MAX_HP);
      var hpBarX = Math.round(16 * uiScaleX);
      var hpBarW = Math.max(1, Math.floor((w - 32) * hpRatio * uiScaleX));
      var hpBarH = Math.max(5, Math.round(10 * uiScaleY));
      var hpBarY = Math.max(0, renderH - Math.round(22 * uiScaleY));
      gl.scissor(hpBarX, hpBarY, hpBarW, hpBarH);
      gl.clearColor(0.29, 0.87, 0.36, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);

      if (shieldTimer > 0) {
        gl.enable(gl.SCISSOR_TEST);
        var shBarX = Math.round(16 * uiScaleX);
        var shBarW = Math.max(1, Math.floor((w - 32) * Math.min(1, shieldTimer / 5.5) * uiScaleX));
        var shBarH = Math.max(3, Math.round(6 * uiScaleY));
        var shBarY = Math.max(0, renderH - Math.round(48 * uiScaleY));
        gl.scissor(shBarX, shBarY, shBarW, shBarH);
        gl.clearColor(0.34, 0.76, 0.98, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);
      }

      gl.enable(gl.SCISSOR_TEST);
      var progress = Math.min(1, score / needScore);
      var pgBarX = Math.round(16 * uiScaleX);
      var pgBarW = Math.max(1, Math.floor((w - 32) * progress * uiScaleX));
      var pgBarH = Math.max(4, Math.round(7 * uiScaleY));
      var pgBarY = Math.max(0, renderH - Math.round(36 * uiScaleY));
      gl.scissor(pgBarX, pgBarY, pgBarW, pgBarH);
      gl.clearColor(0.95, 0.78, 0.2, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);

      if (bossActive) {
        var boss = null;
        var bossHpRatio = 0;
        for (i = 0; i < enemies.length; i++) {
          if (enemies[i].boss) {
            boss = enemies[i];
            bossHpRatio = Math.max(0, (enemies[i].hp || 0) / Math.max(1, enemies[i].hpMax || 1));
            break;
          }
        }
        if (boss && projectScreenPos(enemyBarPos, boss.x, boss.y + (boss.r || 1.8) * 1.15, boss.z)) {
          gl.enable(gl.SCISSOR_TEST);
          var bossBarFullW = Math.max(120, Math.floor((boss.r || 1.8) * 115));
          var bossBarH = Math.max(8, Math.floor(10 * uiScaleY));
          var bossBarX = Math.floor(enemyBarPos[0] - bossBarFullW * 0.5);
          var bossBarY = Math.floor(enemyBarPos[1] + 16);
          if (!(bossBarX > renderW - 2 || bossBarY > renderH - 2 || bossBarX + bossBarFullW < 2 || bossBarY + bossBarH < 2)) {
            var clipX = Math.max(0, bossBarX);
            var clipY = Math.max(0, bossBarY);
            var clipW = Math.max(1, Math.min(renderW - clipX, bossBarFullW - Math.max(0, clipX - bossBarX)));
            var clipH = Math.max(1, Math.min(renderH - clipY, bossBarH));
            gl.scissor(clipX, clipY, clipW, clipH);
            gl.clearColor(0.2, 0.14, 0.26, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            var bossFillW = Math.floor(bossBarFullW * bossHpRatio);
            if (bossFillW > 0) {
              var fillClipW = Math.max(1, Math.min(renderW - clipX, Math.min(clipW, bossFillW - Math.max(0, clipX - bossBarX))));
              if (fillClipW > 0) {
                gl.scissor(clipX, clipY, fillClipW, clipH);
                gl.clearColor(0.9, 0.26, 0.8, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
              }
            }
          }
          gl.disable(gl.SCISSOR_TEST);
        }
      }

      // 敌人目标血条（普通小条，Boss 主要看顶部 Boss 条）
      gl.enable(gl.SCISSOR_TEST);
      for (i = 0; i < enemies.length; i++) {
        var en = enemies[i];
        if (!en || en.boss) continue;
        if (!projectScreenPos(enemyBarPos, en.x, en.y + (en.r || 0.5) * 1.15, en.z)) continue;
        var eHpRatio = Math.max(0, Math.min(1, (en.hp || 0) / Math.max(1, en.hpMax || 1)));
        var barW = Math.max(36, Math.floor((en.r || 0.5) * 42));
        var barH = 5;
        var bx = Math.floor(enemyBarPos[0] - barW * 0.5);
        var by = Math.floor(enemyBarPos[1] + 10);
        if (bx < 0 || bx > renderW - 2 || by < 0 || by > renderH - 2) continue;
        gl.scissor(Math.max(0, bx), Math.max(0, by), Math.max(1, Math.min(renderW - bx, barW)), barH);
        gl.clearColor(0.18, 0.2, 0.24, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.scissor(Math.max(0, bx), Math.max(0, by), Math.max(1, Math.min(renderW - bx, Math.floor(barW * eHpRatio))), barH);
        gl.clearColor(0.98, 0.35, 0.35, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
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
