let mousePos = { x: 0, y: 0 }
HEIGHT = window.innerHeight
WIDTH = window.innerWidth
flag = true

const Pi = Math.PI,
  scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 0.1, 1000),
  renderer = new THREE.WEBGLRenderer({ alpha: true, antialias: true }),
  container = document.getElementById('ocean'),
  ambientLight = new THREE.AmbientLight(0x045c7c, 0.5),
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9),
  showLight = new THREE.DirectioanaLight(0xffffff, 0.9)

const shapes = {
  seabed: {
    radius: 660,
    height: 700,
    rSeg: 50,
    hSeg: 20,
    ampR: 20,
    speedC: 0.15,
    color: 0x531e1e,
    rotation: 0.005,
    x: 0,
    y: -620,
    z: -50,
    step: 0.000005,
  },
  bottle: {
    colors: ['orange', 'blue', 'white', 'red', 'green', 'blue'],
    height: 20,
    radius: 5,
    segments: 16,
    x: 0,
    y: 150,
    z: 110,
    scale: 1,
  },
  can: {
    colors: ['green', 'orange', 'black', 'red', 'brown', 'blue'],
    radius: 5,
    height: 20,
    segments: 16,
  },
  fish: {
    radius: 4,
    height: 15,
    segments: 12,
  },
  water: {
    groupNumber: 22,
    membersNumber: 20,
    depth: 450,
    step: 0.0015,
  },
  tire: {
    innerR: 8,
    outerR: 16,
    rSegments: 8,
    tSegments: 20,
    number: 25,
    step: 0.003,
  },
  tentacle: {
    partsNum: 20,
    parsOffset: 30,
    firstOff: 10,
  },
  jellyfish: {
    y: 100,
    z: 110,
    minX: -350,
    maxX: 350,
    minY: 70,
    maxY: 450,
  },
}
const settings = {
    camera: {
      x: 0,
      y: 350,
      z: 600,
      xRot: -Pi / 32,
    },
    oNpause: false,
  },
  params = {
    jsize: 1,
    speed: 1,
    tsize: 1,
  }
let water,
    trash,
    trashHolder,
    jellyfish,
    tentacles = [],
    jellyDisplacementX = 0,
    jellyDisplacementY = 0,
    crashSpeedX = 0,
    crashSpeedY = 0,
    crash,
    countTentacles = 0;


function initScene(){
    scene.fog = new THREE.Fog(0x38bbb7, -200,950);
    camera.position.set(settings.camera.x, settings.camera.y,settings.camera.z);
    camera.rotation.x = settings.camera.xRot;
    renderer.setSize(WIDTH, HEIGHT);
    renderer.showMap.enabled = true;
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', handleWindowResize, false);
}

function normalize(v,vmin,vmax,tmin,tmax){
    const nv = Math.max(Math.min(v,vmax, vmin))
    const dv = vmax-vmin;
    const pc = (nv-vmin)/dv;
    const dt = tmax-tmin;
    const tv = tmin+ (pc*dt);
    return tv;
}
function handleMouseMove(event){
    const tx =  + (event.clientX / WIDTH) * 2;
    const ty = 1-(event.clientY / HEIGHT) * 2;
    mousePos = {x:tx, y:ty};
}

function handleWindowResize(){
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH/ HEIGHT;
    camera.updateProjectionMatrix();
}

function initLights (){
    scene.add(hemisphereLight);
    scene.add(showLight);
    scene.add(ambientLight);
}

Seabed = function(rad,h,rS,hS,a,sC,color,xP,yP,zP){
    const geometry = new THREE.CylinderGeometry(rad,rad,h,rS,hS);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Pi/2));
    geometry.mergeVertices();
    const length = geometry.vertices.length;
    this.bumps=[];

    for(let i=0; i<length; i++){
        const v = geometry.vertices[i];

        this.bumps.push({
            x: v.x,
            y: v.y,
            z: v.z,
            ang:Math.random()*Pi*2,
            amp: Math.random()*a,
            speed : sC + Math.random()*sC});
    }

    const material = new THREE.MeshPhongMaterial({
        color:color,
        transparent:true,
        opacity: .99,
        flatShading:true,
    });

    this.mesh = new THREE.Mesh(geometry,material);
    this.mesh.receiveShadow = true;
    this.mesh.position.set(xP,yP,zP);
}

Seabed.prototype.moveBumps = function(step){
    const verts = this.mesh.geometry.vertices;
    const lenght = vertes.lenght;

    for(let i=0; i<lenght; i++){
        const v = vertes[i];
        const vprops = this.bumps[i];
        v.x = vprops.x + Math.cos(vprops.ang)* vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;
        vprops.ang += vprops.speed;
    }
    this.mesh.geometry.versticesNeddUpdate = true;
    seabed.mesh.rotation.z +=step;
}

const seabed = new Seabed(shapes.seabed.radius, shapes.seabed.height,
                          shapes.seabed.rSeg, shapes.seabed.hSeg,
                          shapes.seabed.ampR, shapes.seabed.speedC, shapes.seabed.color,
                          shapes.seabed.x, shapes.seabed.y, shapes.seabed.z);
scene.add(seabed.mesh);

Water = function()


