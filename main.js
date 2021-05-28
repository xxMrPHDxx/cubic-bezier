const canvas = document.querySelector('canvas#screen');
canvas.setAttribute('width', window.width=400);
canvas.setAttribute('height', window.height=400);
const ctx = canvas.getContext('2d');

const audiocontext = new (AudioContext || webkitAudioContext)();

const FPS = 30;

let p = [
	{ x: 30, y: height/2 },
	{ x: width/4, y: height/4 },
	{ x: width*3/4, y: height*3/4 },
	{ x: width-30, y: height/2 }
];

function quadraticBezier(p0, p1, p2, t){
	const t1 = 1-t;
	return {
		x: t1**2*p0.x + 2*t1*t*p1.x + t**2*p2.x,
		y: t1**2*p0.y + 2*t1*t*p1.y + t**2*p2.y
	};
}

function loadSound(path){
	return fetch(path)
		.then(res=>res.arrayBuffer())
		.then(ab=>audiocontext.decodeAudioData(ab))
		.then(buffer=>{
			const audio = audiocontext.createBufferSource();
			audio.buffer = buffer;
			return new (class Sound{
				static AUDIO = Symbol('[AUDIO]');
				static ANALYSER = Symbol('[ANALYSER]');
				constructor(audio){
					this[Sound.AUDIO] = audio;
					audio.connect(this[Sound.ANALYSER] = audiocontext.createAnalyser());
				}
				get audio(){ return this[Sound.AUDIO]; }
				get analyser(){ return this[Sound.ANALYSER]; }
				play(){
					this.audio.connect(audiocontext.destination);
					this.audio.start();
				}
			})(audio);
		});
}

let music;
async function setup(){
	music = await loadSound('this-dot.mp3');
	console.log(music, music.analyser);
	music.audio.loop = true;
	music.play();
}

function update(){

}

function draw(){
	// Clears background to black?
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);

	// Drawing the points
	ctx.fillStyle = 'red';
	for(const {x, y} of p){
		ctx.beginPath();
		ctx.ellipse(x, y, 10, 10, 0, 0, Math.PI*2);
		ctx.fill();
	}

	// Drawing the cubic bezier curve
	ctx.strokeStyle = 'rgb(100, 50, 66)';
	ctx.lineWidth = 4;
	ctx.beginPath();
	for(let t=0; t<=1; t+=0.01){
		const t1 = 1-t;
		const qb1 = quadraticBezier(...p.slice(0, 3), t);
		const qb2 = quadraticBezier(...p.slice(1, 4), t);
		const x = t1*qb1.x + t*qb2.x, y = t1*qb1.y + t*qb2.y;
		ctx[t === 0 ? 'moveTo' : 'lineTo'](x, y);
	}
	ctx.stroke();
}

let unprocessedTime = 0, lastTimer = performance.now(), lastTime = performance.now(), now;
let frames = 0, ticks = 0;
function animate(){
	let shouldRender = false;
	now = performance.now();
	unprocessedTime += (now - lastTime) / 1000 * FPS;
	lastTime = now;
	while(unprocessedTime > 1){
		update();
		ticks++;
		shouldRender = true;
		unprocessedTime--;
	}
	if(shouldRender){
		draw();
		frames++;
	}
	const n = performance.now();
	if(n - lastTimer >= 1000){
		fps.textContent = `fps=${frames}, ticks=${ticks}`;
		lastTimer = n;
		frames = ticks = 0;
	}
	requestAnimationFrame(animate);
}

Promise.resolve(setup()).then(animate);
