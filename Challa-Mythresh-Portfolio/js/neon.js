(() => {
  const stage = document.querySelector('.neon-stage');
  if (!stage || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const paths = [...stage.querySelectorAll('.neon-line')];
  const glows = [...stage.querySelectorAll('.neon-glow')];
  let progress = 0, visible = false, running = false, start = null;
  const clamp = x => Math.max(0, Math.min(1,x));
  const smooth = x => { x=clamp(x); return x*x*(3-2*x); };
  function frame(now) {
    if (!visible) { running=false; return; }
    if (start === null) start=now;
    const r=stage.getBoundingClientRect();
    const scrollProgress=clamp((innerHeight-r.top)/(r.height+innerHeight*.08));
    progress=Math.max(progress,scrollProgress,clamp((now-start)/1600));
    const phase=now/700;
    paths.forEach((path,i)=>{
      let d='';
      for(let x=0;x<=1200;x+=5){
        const distance=Math.abs(x-600);
        const spread=smooth((distance-145)/330);
        const wave=(1-smooth((distance-100)/180))*13*Math.sin(x*.085-phase+i*2*Math.PI/5);
        const y=160+(i-2)*60*spread+wave;
        d+=(x?' L':'M')+x+','+y.toFixed(2);
      }
      [path,glows[i]].forEach(p=>{p.setAttribute('d',d);p.setAttribute('pathLength','1');p.style.strokeDasharray=progress>=1?'none':'1';p.style.strokeDashoffset=String(1-progress);});
    });
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;
    if(visible&&!running){running=true;requestAnimationFrame(frame);}
  }).observe(stage);
  else {visible=true;running=true;requestAnimationFrame(frame);}
})();
