import {useEffect, useRef} from 'react'

// A low-resolution fragment shader keeps the decorative motion inexpensive.
export default function HeroShader() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext('webgl', {alpha: true, antialias: false})
    if (!canvas || !gl) return
    const program = gl.createProgram()!
    const shaders: WebGLShader[] = []
    const sources = [
      'attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}',
      `precision mediump float;
       uniform vec2 resolution; uniform float time;
       void main(){
         vec2 uv=gl_FragCoord.xy/resolution;
         float drift=sin(time*.09)*.12;
         float plane=uv.x*.7+uv.y*.45-drift;
         float light=smoothstep(.25,.7,plane)*(1.-smoothstep(.7,1.2,plane));
         float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
         float alpha=light*.065+grain*.006;
         gl_FragColor=vec4(vec3(.73,.89,.83)*alpha,alpha);
       }`,
    ]
    for (let i = 0; i < sources.length; i++) {
      const shader = gl.createShader(i === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER)!
      shaders.push(shader)
      gl.shaderSource(shader, sources[i])
      gl.compileShader(shader)
      gl.attachShader(program, shader)
    }
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(shader => gl.deleteShader(shader))
      gl.deleteProgram(program)
      return
    }
    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const resolution = gl.getUniformLocation(program, 'resolution')
    const time = gl.getUniformLocation(program, 'time')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let visible = true
    let last = 0
    const draw = (now: number) => {
      if (now - last > 32 || reduced.matches) {
        last = now
        const width = Math.max(1, Math.round(canvas.clientWidth / 2))
        const height = Math.max(1, Math.round(canvas.clientHeight / 2))
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
        }
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.uniform2f(resolution, canvas.width, canvas.height)
        gl.uniform1f(time, reduced.matches ? 0 : now / 1000)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      if (visible && !reduced.matches && !document.hidden) frame = requestAnimationFrame(draw)
    }
    const restart = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw) }
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; restart()})
    observer.observe(canvas)
    reduced.addEventListener('change', restart)
    document.addEventListener('visibilitychange', restart)
    restart()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      reduced.removeEventListener('change', restart)
      document.removeEventListener('visibilitychange', restart)
      gl.deleteBuffer(buffer)
      shaders.forEach(shader => gl.deleteShader(shader))
      gl.deleteProgram(program)
    }
  }, [])
  return <canvas ref={ref} aria-hidden="true" className="astryx-hero-shader" />
}
