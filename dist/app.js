'use strict';

const stages = {
  encode:{kicker:'A population-level representation',title:'Retain population structure in a small learned state.',equation:'N = Σ w<sub>p</sub><span>z = (1/N) Σ w<sub>p</sub> φ(x<sub>p</sub>)</span>',description:'A shared particle encoder maps species-mass vectors to learned features. Number-weighted aggregation gives nine shape coordinates, while total number concentration is retained explicitly.',note:'The encoder and decoder follow the existing AeroMELD representation and remain fixed during dynamics training.'},
  evolve:{kicker:'The contribution of AeroMELD-Coag',title:'Advance the compact state through nonlinear coagulation.',equation:'dN/dt = N² F(z)<span>dz/dt = N G(z)</span>',description:'A neural ODE predicts number and shape rates from the current shape. The analytically prescribed concentration factors scale these rates, and a numerical integrator advances the state recursively.',note:'Only the initial population is encoded. Later states are model predictions; particle lists are not reconstructed during integration.'},
  decode:{kicker:'Connect latent states to physical quantities',title:'Recover multiple outputs at the times of interest.',equation:'(N<sub>t</sub>, z<sub>t</sub>)<span>Size · Composition · CCN · Optics · Freezing</span>',description:'The fixed decoder maps the evolving compact state to size-resolved quantities and diagnostic spectra. These outputs connect latent predictions to cloud activation, optical properties, and immersion freezing.',note:'Decoding recovers the retained outputs. It does not recover the identity or history of individual particles.'}
};
function selectStage(name){
  const s=stages[name];
  document.querySelectorAll('[data-stage]').forEach(button=>{const selected=button.dataset.stage===name;button.classList.toggle('active',selected);button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  document.getElementById('stage-panel').setAttribute('aria-labelledby','tab-'+name);
  document.getElementById('stage-kicker').textContent=s.kicker;
  document.getElementById('stage-title').innerHTML=s.title;
  document.getElementById('stage-equation').innerHTML=s.equation;
  document.getElementById('stage-description').textContent=s.description;
  document.getElementById('stage-note').textContent=s.note;
}
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>selectStage(button.dataset.stage)));

const slider=document.getElementById('concentration');
function updateScaling(){const value=Number(slider.value);document.getElementById('scale-value').textContent=value+'×';document.getElementById('number-rate').textContent=(value*value)+'×';document.getElementById('shape-rate').textContent=value+'×';}
slider.addEventListener('input',updateScaling);

const results={
  ccn:{title:'Composition differences change cloud activation.',text:'In this selected case, particles of similar size have different critical supersaturations. The sectional representation averages composition within each size bin. AeroMELD more closely follows the particle-resolved activation spectrum.',image:'assets/ccn.png',alt:'Selected CCN case comparing activation spectra and wet-diameter versus critical-supersaturation distributions.',caption:'Selected mixing-state example from the arXiv paper. Particle maps show PartMC and sectional representations; AeroMELD is evaluated through its predicted activation spectrum.'},
  freezing:{title:'The distribution of ice-active material matters.',text:'In this selected case, efficient ice-active material is concentrated in a small subset of particles. Averaging composition within bins redistributes that material. AeroMELD more closely follows the particle-resolved frozen-fraction spectrum.',image:'assets/freezing.png',alt:'Selected immersion-freezing case comparing frozen-fraction spectra and particle composition distributions.',caption:'Selected freezing example from the arXiv paper. Particle maps compare PartMC and sectional representations; AeroMELD appears through its predicted frozen-fraction spectrum.'},
  dynamics:{title:'Track recursive prediction error over 48 hours.',text:'Predicted latent states become inputs for the next time step. The held-out evaluation follows errors in the nine shape coordinates and total number concentration throughout the rollout.',image:'assets/rollout-errors.png',alt:'Prediction error in latent shape and total number concentration across held-out 48-hour rollouts.',caption:'Original rollout-error figure from the arXiv paper, evaluated across 2,000 held-out trajectories. Consult the paper for the precise error definitions and distribution summaries.'}
};
function selectResult(name){const r=results[name];document.querySelectorAll('[data-result]').forEach(button=>{const selected=button.dataset.result===name;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});document.getElementById('result-panel').setAttribute('aria-labelledby','result-tab-'+name);document.getElementById('result-title').textContent=r.title;document.getElementById('result-text').textContent=r.text;const img=document.getElementById('result-image');img.src=r.image;img.alt=r.alt;document.getElementById('result-image-link').href=r.image;document.getElementById('result-caption').textContent=r.caption;}
document.querySelectorAll('[data-result]').forEach(button=>button.addEventListener('click',()=>selectResult(button.dataset.result)));

// Keyboard navigation follows the active tab within each tab list.
document.querySelectorAll('[role="tablist"]').forEach(list=>list.addEventListener('keydown',event=>{const tabs=[...list.querySelectorAll('[role="tab"]')];const current=tabs.indexOf(document.activeElement);if(current<0)return;let next=current;if(['ArrowRight','ArrowDown'].includes(event.key))next=(current+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(current-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();tabs[next].focus();tabs[next].click();}));

document.getElementById('copy-citation').addEventListener('click',async()=>{
  const button=document.getElementById('copy-citation'),status=document.getElementById('copy-status');
  try{await navigator.clipboard.writeText(document.getElementById('bibtex').textContent);button.textContent='Copied';status.textContent='BibTeX copied to clipboard.';setTimeout(()=>{button.textContent='Copy BibTeX';status.textContent='';},2500);}catch{const range=document.createRange();range.selectNodeContents(document.getElementById('bibtex'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Citation selected. Copy it with your browser’s copy command.';}
});

const navLinks=[...document.querySelectorAll('.header nav a')];
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(link=>link.classList.toggle('active',link.hash==='#'+entry.target.id));}});},{rootMargin:'-20% 0px -55% 0px',threshold:0});
['overview','how-it-works','results','comparison','paper'].forEach(id=>observer.observe(document.getElementById(id)));

const diagramDescriptions = {
  all: 'The encoder is used at initialization. The neural ODE then advances N and z, and the decoder is evaluated at output times.',
  encode: 'The fixed encoder maps the initial weighted particle population to total number concentration N and nine learned shape coordinates z. This encoding is performed once at initialization.',
  evolve: 'The neural ODE supplies shape-dependent rates. Known concentration factors impose dN/dt = N²F(z) and dz/dt = NG(z), and numerical integration advances the compact state recursively.',
  decode: 'At output times, the fixed decoder recovers size-resolved composition, cloud activation, optical properties, and frozen fraction. The decoder produces these quantities without reconstructing individual-particle identities.'
};
let walkthrough = null;
function setDiagramView(view) {
  document.getElementById('architecture-stage').dataset.view=view;
  document.querySelectorAll('.diagram-tabs [role="tab"]').forEach(tab=>{const active=tab.dataset.view===view;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  const description=document.getElementById('diagram-description');description.textContent=diagramDescriptions[view];description.setAttribute('aria-labelledby','diagram-tab-'+view);
}
function stopWalkthrough(){clearInterval(walkthrough);walkthrough=null;const button=document.getElementById('diagram-play');button.setAttribute('aria-pressed','false');button.textContent='Walk through';}
// The architecture walkthrough highlights the published figure; it is not model simulation.
 document.querySelectorAll('.diagram-tabs button').forEach(button=>button.addEventListener('click',()=>{stopWalkthrough();setDiagramView(button.dataset.view);}));
document.getElementById('diagram-play').addEventListener('click',()=>{if(walkthrough){stopWalkthrough();return;}let step=0;const sequence=['encode','evolve','decode'];setDiagramView(sequence[0]);const button=document.getElementById('diagram-play');button.textContent='Pause';button.setAttribute('aria-pressed','true');walkthrough=setInterval(()=>{step++;if(step===sequence.length){stopWalkthrough();setDiagramView('all');return;}setDiagramView(sequence[step]);},2800);});
const figureDialog=document.getElementById('figure-dialog');
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('enlarged-image').src=button.dataset.zoom;figureDialog.showModal();}));
document.getElementById('close-figure').addEventListener('click',()=>figureDialog.close());
figureDialog.addEventListener('click',event=>{if(event.target===figureDialog)figureDialog.close();});
