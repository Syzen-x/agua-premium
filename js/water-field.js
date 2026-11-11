/* Fondo del inicio: luz a través del agua (cáusticas) en WebGL.
   Se mueve lento, responde al puntero con ondas y deja caer una onda
   donde se posa la botella. Si no hay WebGL o se pide menos movimiento,
   queda un cuadro fijo o el degradado de CSS. */
(function () {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion/.test(location.search);
  const MAX_RIPPLES = 10;

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;

  const FRAG = `
    precision mediump float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec3 uRip[${MAX_RIPPLES}];

    float caustic(vec2 uv, float t) {
      vec2 p = uv * 6.2831853 - 250.0;
      vec2 i = p;
      float c = 1.0;
      float inten = 0.005;
      for (int n = 0; n < 5; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 5.0;
      c = 1.17 - pow(c, 1.4);
      return clamp(pow(abs(c), 8.0), 0.0, 1.0);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      float aspect = uRes.x / uRes.y;
      vec2 p = vec2(uv.x * aspect, uv.y);

      // ondas: desplazan la luz y dibujan un anillo tenue
      vec2 disp = vec2(0.0);
      float ring = 0.0;
      for (int k = 0; k < ${MAX_RIPPLES}; k++) {
        vec3 r = uRip[k];
        float age = uTime - r.z;
        if (r.z < 0.0 || age < 0.0 || age > 4.5) continue;
        vec2 d = p - vec2(r.x * aspect, r.y);
        float dist = length(d);
        float front = age * 0.32;
        float w = sin((dist - front) * 55.0) * exp(-abs(dist - front) * 16.0) * exp(-age * 1.1);
        disp += (d / max(dist, 0.0001)) * w * 0.018;
        ring += w;
      }

      float t = uTime * 0.32;
      float c1 = caustic(p * 2.1 + disp, t);
      float c2 = caustic(p * 3.4 + disp * 1.4 + 3.1, t * 1.3 + 7.0);
      float light = smoothstep(0.08, 0.95, c1 * 0.8 + c2 * 0.4);

      // fondo: agua clara arriba, un poco más profunda abajo
      vec3 deep = vec3(0.690, 0.835, 0.820);
      vec3 shallow = vec3(0.875, 0.933, 0.925);
      vec3 col = mix(deep, shallow, smoothstep(0.0, 1.0, uv.y));
      // un velo verde muy leve, del color de la marca, al pie
      col = mix(col, vec3(0.60, 0.82, 0.68), (1.0 - smoothstep(0.0, 0.4, uv.y)) * 0.4);

      col += vec3(0.97, 1.0, 0.99) * light * 0.6;
      col += vec3(1.0) * ring * 0.06;

      // la luz sigue suavemente al puntero
      float ml = exp(-length(p - vec2(uMouse.x * aspect, uMouse.y)) * 3.0);
      col += vec3(0.98, 1.0, 0.99) * ml * 0.05;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  class WaterField {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' });
      this.ok = !!gl;
      if (!gl) { canvas.style.display = 'none'; return; }
      this.gl = gl;
      const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) { this.ok = false; canvas.style.display = 'none'; return; }
      const prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {
        res: gl.getUniformLocation(prog, 'uRes'),
        time: gl.getUniformLocation(prog, 'uTime'),
        mouse: gl.getUniformLocation(prog, 'uMouse'),
        rip: gl.getUniformLocation(prog, 'uRip')
      };
      this.ripples = new Float32Array(MAX_RIPPLES * 3).fill(-1);
      this.rIndex = 0;
      this.t = 8.0;
      this.mouse = [0.7, 0.5];
      this.mouseTarget = [0.7, 0.5];
      this.visible = true;
      this.running = false;
      this.lastDrop = 0;
      this.frame = this.frame.bind(this);
      this.resize = this.resize.bind(this);
      this.resize();
      window.addEventListener('resize', this.resize, { passive: true });
      this.bindPointer();
      this.bindVisibility();
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      // resolución reducida: la luz es suave, no necesita píxeles finos
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (this.w < 720 ? 0.55 : 0.7);
      this.canvas.width = Math.round(this.w * scale);
      this.canvas.height = Math.round(this.h * scale);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      if (!this.running) this.draw();
    }

    /* x, y en píxeles CSS relativos al canvas */
    ripple(x, y) {
      if (!this.ok) return;
      const i = this.rIndex * 3;
      this.ripples[i] = x / this.w;
      this.ripples[i + 1] = 1 - y / this.h;
      this.ripples[i + 2] = this.t;
      this.rIndex = (this.rIndex + 1) % MAX_RIPPLES;
      if (reduce) this.draw();
    }

    rippleAtClient(cx, cy) {
      const r = this.canvas.getBoundingClientRect();
      this.ripple(cx - r.left, cy - r.top);
    }

    bindPointer() {
      const hero = this.canvas.parentElement;
      hero.addEventListener('pointermove', (e) => {
        const r = this.canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        this.mouseTarget = [x / this.w, 1 - y / this.h];
        const now = performance.now();
        if (this.prev) {
          const d = Math.hypot(x - this.prev.x, y - this.prev.y);
          if (d > 60 && now - this.lastDrop > 180) { this.ripple(x, y); this.lastDrop = now; this.prev = { x, y }; }
        } else this.prev = { x, y };
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { this.prev = null; }, { passive: true });
      hero.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a,button,input,select,label,form')) return;
        this.rippleAtClient(e.clientX, e.clientY);
      }, { passive: true });
    }

    bindVisibility() {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; if (this.visible) this.start(); }, { threshold: 0 }).observe(this.canvas);
      }
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this.start(); });
    }

    nudge() { /* la luz no acelera con el scroll: queda serena */ }

    draw() {
      const gl = this.gl, u = this.u;
      this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * 0.06;
      this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * 0.06;
      gl.uniform2f(u.res, this.canvas.width, this.canvas.height);
      gl.uniform1f(u.time, this.t);
      gl.uniform2f(u.mouse, this.mouse[0], this.mouse[1]);
      gl.uniform3fv(u.rip, this.ripples);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    frame(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
      this.last = now;
      this.t += dt;
      this.draw();
      if (this.visible && !document.hidden) requestAnimationFrame(this.frame);
      else this.running = false;
    }

    start() {
      if (!this.ok) return;
      if (reduce) { this.draw(); return; }
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    }
  }

  window.WaterField = WaterField;
})();
