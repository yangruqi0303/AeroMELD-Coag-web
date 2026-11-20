'use strict';

(async function initPublishedResultPlayback(){
  const response=await fetch('assets/paper-traces.json');
  if(!response.ok)throw new Error('Published figure traces could not be loaded.');
  const data=await response.json();
  const NS='http://www.w3.org/2000/svg';
  const colors={PartMC:'#25272a',AeroMELD:'#aa464c',Sectional:'#4d7894'};
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const left={p:0,playing:!reduced};
  const right={p:.25,playing:!reduced,kind:'ccn',case:'complex'};
  let visible=true;
  const create=(tag,attrs={},text='')=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text)el.textContent=text;return el;};
  function append(parent,tag,attrs,text){const e=create(tag,attrs,text);parent.appendChild(e);return e;}
  function chart(svg,options){
    svg.replaceChildren();
    const box={left:65,right:476,top:42,bottom:options.bottom};
    const x=u=>box.left+u*(box.right-box.left);
    const y=v=>box.bottom-(v-options.min)/(options.max-options.min)*(box.bottom-box.top);
    const defs=append(svg,'defs');
    const clip=append(defs,'clipPath',{id:options.id+'-domain'});
    append(clip,'rect',{x:box.left,y:box.top,width:box.right-box.left,height:box.bottom-box.top});
    const reveal=append(defs,'clipPath',{id:options.id+'-reveal'});
    const revealRect=append(reveal,'rect',{x:box.left,y:box.top,width:0,height:box.bottom-box.top});
    append(svg,'text',{x:box.left,y:21,class:'demo-axis-title'},options.title);
    for(const tick of options.yTicks){const yy=y(tick.value);append(svg,'line',{x1:box.left,x2:box.right,y1:yy,y2:yy,class:'demo-grid'});append(svg,'text',{x:box.left-11,y:yy+5,'text-anchor':'end',class:'demo-tick'},tick.label);}
    for(const tick of options.xTicks){const xx=x(tick.u);append(svg,'text',{x:xx,y:box.bottom+24,'text-anchor':'middle',class:'demo-tick'},tick.label);}
    if(options.xTitle)append(svg,'text',{x:(box.left+box.right)/2,y:options.height-10,'text-anchor':'middle',class:'demo-axis-title'},options.xTitle);
    const domain=append(svg,'g',{'clip-path':`url(#${options.id}-domain)`});
    const background=append(domain,'g',{'opacity':'.16'});
    const foreground=append(domain,'g',{'clip-path':`url(#${options.id}-reveal)`});
    const cursor=append(domain,'line',{x1:box.left,x2:box.left,y1:box.top,y2:box.bottom,class:'demo-cursor'});
    const dots=append(domain,'g');
    return{svg,box,x,y,background,foreground,cursor,dots,revealRect};
  }
  function pathD(points,x,y,xmap,vmap=v=>v){return points.map(([t,v],i)=>(i?'L':'M')+x(xmap(t)).toFixed(3)+' '+y(vmap(v)).toFixed(3)).join(' ');}
  function line(container,d,color,extra={}){return append(container,'path',{d,fill:'none',stroke:color,'stroke-width':2,'stroke-linejoin':'round','stroke-linecap':'round',...extra});}
  function dot(container,color){return append(container,'circle',{r:4.2,fill:color,stroke:'#fff','stroke-width':1.4});}
  function interp(points,x,logX=false,logY=false){
    const query=logX?Math.log10(x):x;
    for(let i=1;i<points.length;i++){
      const x1=logX?Math.log10(points[i][0]):points[i][0];
      if(query<=x1){const x0=logX?Math.log10(points[i-1][0]):points[i-1][0];const a=Math.max(0,Math.min(1,(query-x0)/(x1-x0)));const y0=logY?Math.log10(points[i-1][1]):points[i-1][1];const y1=logY?Math.log10(points[i][1]):points[i][1];const value=y0+a*(y1-y0);return logY?10**value:value;}
    }
    return points.at(-1)[1];
  }
  function reveal(chart,u,fromRight=false){const xx=chart.x(u);chart.cursor.setAttribute('x1',xx);chart.cursor.setAttribute('x2',xx);chart.revealRect.setAttribute('x',fromRight?xx:chart.box.left);chart.revealRect.setAttribute('width',fromRight?chart.box.right-xx:xx-chart.box.left);}
  const numberChart=chart(document.getElementById('number-animation'),{id:'number',bottom:224,height:285,min:1600,max:2850,title:'Number concentration (cm⁻³)',xTitle:'Elapsed time (h)',xTicks:[0,12,24,36,48].map(t=>({u:t/48,label:String(t)})),yTicks:[1600,2000,2400,2800].map(v=>({value:v,label:v.toLocaleString('en-US')}))});
  const numberDots={};
  for(const model of ['Sectional','PartMC','AeroMELD']){const d=pathD(data.number[model],numberChart.x,numberChart.y,t=>t/48);line(numberChart.background,d,colors[model]);line(numberChart.foreground,d,colors[model]);numberDots[model]=dot(numberChart.dots,colors[model]);}
  const latentChart=chart(document.getElementById('latent-animation'),{id:'latent',bottom:162,height:205,min:-2,max:4,title:'Latent shape z₁ … z₉',xTitle:'Elapsed time (h)',xTicks:[0,12,24,36,48].map(t=>({u:t/48,label:String(t)})),yTicks:[-1,0,1,2,3].map(v=>({value:v,label:String(v)}))});
  for(const coordinate of data.latent){for(const model of ['PartMC','AeroMELD']){const d=pathD(coordinate[model],latentChart.x,latentChart.y,t=>t/48);const extra={'stroke-width':1.3,...(model==='AeroMELD'?{'stroke-dasharray':'4 3'}:{})};line(latentChart.background,d,coordinate.color,extra);line(latentChart.foreground,d,coordinate.color,extra);}}
  function renderRollout(){const t=left.p*48;reveal(numberChart,left.p);reveal(latentChart,left.p);document.getElementById('rollout-time').textContent=t.toFixed(1)+' h';document.getElementById('rollout-position').value=t;for(const model of Object.keys(numberDots)){const n=interp(data.number[model],t);numberDots[model].setAttribute('cx',numberChart.x(left.p));numberDots[model].setAttribute('cy',numberChart.y(n));if(model==='PartMC')document.getElementById('number-reference').textContent=Math.round(n).toLocaleString('en-US');if(model==='AeroMELD')document.getElementById('number-prediction').textContent=Math.round(n).toLocaleString('en-US');}}
  let spectrumChart,spectrumDots={};
  const context={
    ccn:{complex:'The sectional model overestimates activation in this case.',simple:'Both reduced models closely follow PartMC.'},
    freezing:{complex:'The sectional model overestimates freezing in this case.',simple:'Both reduced models closely follow PartMC.'}
  };
  function buildSpectrum(){
    const freezing=right.kind==='freezing';
    spectrumChart=chart(document.getElementById('spectrum-animation'),{id:'spectrum',bottom:269,height:330,min:freezing?-10:0,max:freezing?0:1,title:freezing?'Frozen fraction':'Activated fraction (CCN/CN)',xTitle:freezing?'Temperature (°C)':'Supersaturation',xTicks:freezing?[-40,-30,-20,-10,0].map(t=>({u:(t+40)/40,label:String(t)})):[{u:0,label:'10⁻³'},{u:.5,label:'10⁻²'},{u:1,label:'10⁻¹'}],yTicks:freezing?[-10,-8,-6,-4,-2,0].map(v=>({value:v,label:{'-10':'10⁻¹⁰','-8':'10⁻⁸','-6':'10⁻⁶','-4':'10⁻⁴','-2':'10⁻²','0':'1'}[v]})):[0,.25,.5,.75,1].map(v=>({value:v,label:v.toFixed(2)}))});
    spectrumDots={};
    for(const model of ['Sectional','PartMC','AeroMELD']){const d=pathD(data.spectra[right.kind][right.case][model],spectrumChart.x,spectrumChart.y,x=>freezing?(x+40)/40:(Math.log10(x)+3)/2,v=>freezing?Math.log10(v):v);line(spectrumChart.background,d,colors[model]);line(spectrumChart.foreground,d,colors[model],{'stroke-width':2.2});spectrumDots[model]=dot(spectrumChart.dots,colors[model]);}
    document.getElementById('spectrum-heading').textContent=freezing?'Immersion freezing':'Cloud activation';
    document.getElementById('scan-label').textContent=freezing?'Temperature':'Supersaturation';
    document.getElementById('spectrum-axis-note').textContent=freezing?'scan T':'scan s';
    document.getElementById('spectrum-explanation').textContent=context[right.kind][right.case];
    const src=document.getElementById('spectrum-source');src.href='assets/source-figures/'+(freezing?'freezing':'ccn')+'.pdf';
    document.getElementById('spectrum-context').setAttribute('aria-labelledby','spectrum-tab-'+right.kind);
    document.querySelectorAll('[data-spectrum]').forEach(button=>{const selected=button.dataset.spectrum===right.kind;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
    document.querySelectorAll('[data-case]').forEach(button=>{const selected=button.dataset.case===right.case;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('selected',selected);});
    renderSpectrum();
  }
  function formatFraction(value){return value<.001?value.toExponential(1):value.toFixed(2);}
  function renderSpectrum(){
    const freezing=right.kind==='freezing';const u=freezing?1-right.p:right.p;const x=freezing?-40+40*u:10**(-3+2*u);reveal(spectrumChart,u,freezing);
    document.getElementById('scan-value').textContent=freezing?x.toFixed(1)+' °C':x.toPrecision(2);
    document.getElementById('spectrum-position').value=right.p;
    for(const model of Object.keys(spectrumDots)){const fraction=interp(data.spectra[right.kind][right.case][model],x,!freezing,freezing);const marker=spectrumDots[model];marker.setAttribute('cx',spectrumChart.x(u));marker.setAttribute('cy',spectrumChart.y(freezing?Math.log10(fraction):fraction));const id={PartMC:'spectrum-reference',AeroMELD:'spectrum-prediction',Sectional:'spectrum-sectional'}[model];document.getElementById(id).textContent=formatFraction(fraction);}
  }
  function syncButton(id,state,label){const b=document.getElementById(id);b.innerHTML=state.playing?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3v12H5zM12 4h3v12h-3z"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3l11 7-11 7z"/></svg>';b.setAttribute('aria-pressed',String(state.playing));b.setAttribute('aria-label',(state.playing?'Pause ':'Play ')+label+' animation');}
  document.getElementById('rollout-play').addEventListener('click',()=>{left.playing=!left.playing;syncButton('rollout-play',left,'rollout');});
  document.getElementById('spectrum-play').addEventListener('click',()=>{right.playing=!right.playing;syncButton('spectrum-play',right,'spectrum');});
  document.getElementById('rollout-position').addEventListener('input',event=>{left.p=Number(event.target.value)/48;left.playing=false;syncButton('rollout-play',left,'rollout');renderRollout();});
  document.getElementById('spectrum-position').addEventListener('input',event=>{right.p=Number(event.target.value);right.playing=false;syncButton('spectrum-play',right,'spectrum');renderSpectrum();});
  document.querySelectorAll('[data-spectrum]').forEach(button=>button.addEventListener('click',()=>{right.kind=button.dataset.spectrum;right.p=.25;buildSpectrum();}));
  document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>{right.case=button.dataset.case;buildSpectrum();}));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(document.querySelector('.hero-results'));
  renderRollout();buildSpectrum();syncButton('rollout-play',left,'rollout');syncButton('spectrum-play',right,'spectrum');
  document.getElementById('rollout-demo').dataset.loaded='true';document.getElementById('spectral-demo').dataset.loaded='true';
  let previous=performance.now(),leftHold=0,rightHold=0;
  function animate(now){const dt=Math.max(0,Math.min((now-previous)/1000,.1));previous=now;if(visible&&!document.hidden){if(left.playing){if(left.p>=1){leftHold+=dt;if(leftHold>2){left.p=0;leftHold=0;}}else left.p=Math.min(1,left.p+dt/24);renderRollout();}if(right.playing){if(right.p>=1){rightHold+=dt;if(rightHold>2){right.p=0;rightHold=0;}}else right.p=Math.min(1,right.p+dt/20);renderSpectrum();}}requestAnimationFrame(animate);}
  requestAnimationFrame(animate);
})().catch(error=>{console.error(error);document.querySelectorAll('.demo-source').forEach(el=>el.insertAdjacentText('afterbegin','Animation unavailable; view the published source figure. '));});
