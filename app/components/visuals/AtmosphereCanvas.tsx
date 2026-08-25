"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../portfolio-visuals";

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

// Colors below are the GLSL twins of --cyan #00D4FF, --violet #7C3AED,
// --bg #0A0A0F. Adds are capped at 0.05 so text contrast is untouched.
const FRAG = `
precision mediump float;
uniform vec2 u_res;uniform float u_time;uniform float u_scroll;uniform vec2 u_mouse;
float blob(vec2 p,vec2 c,float r){return smoothstep(r,0.,length(p-c));}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  vec2 p=uv;p.x*=u_res.x/u_res.y;
  float t=u_time*0.05;
  vec2 m=(u_mouse-0.5)*0.12;
  float c1=blob(p,vec2(0.35+0.12*sin(t*1.3),0.72+0.08*cos(t))+m+vec2(0.,u_scroll*0.06),0.6);
  float c2=blob(p,vec2(0.85+0.1*cos(t*0.7),0.22+0.1*sin(t*1.1))+m*0.6-vec2(0.,u_scroll*0.04),0.55);
  vec3 col=vec3(0.039,0.039,0.059);
  col+=vec3(0.,0.83,1.)*c1*0.05;
  col+=vec3(0.49,0.23,0.93)*c2*0.05;
  vec2 g=abs(fract(uv*vec2(28.,28.))-0.5);
  col+=vec3(0.55,0.65,0.8)*smoothstep(0.47,0.5,max(g.x,g.y))*0.025;
  gl_FragColor=vec4(col,1.);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
  return s;
}

/**
 * AtmosphereCanvas — fullscreen nebula-grid behind the whole page.
 * ~30fps, DPR ≤1.5, pauses on document.hidden. Reduced motion renders a
 * single static frame; missing WebGL falls back to a CSS gradient div.
 */
export function AtmosphereCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [webglDead, setWebglDead] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) {
      setWebglDead(true);
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setWebglDead(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mx = 0.5;
    let my = 0.5;
    let smx = 0.5;
    let smy = 0.5;
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth;
      my = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (time: number) => {
      smx += (mx - smx) * 0.03;
      smy += (my - smy) * 0.03;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform1f(
        uScroll,
        window.scrollY / Math.max(1, document.body.scrollHeight)
      );
      gl.uniform2f(uMouse, smx, smy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduced) {
      draw(10); // one static frame, arbitrary pleasant time
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", resize);
      };
    }

    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (now - last >= 33 && !document.hidden) {
        last = now;
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (webglDead) {
    return <div id="atmosphere" className="atmosphere-fallback" aria-hidden />;
  }
  return <canvas id="atmosphere" ref={ref} aria-hidden />;
}
