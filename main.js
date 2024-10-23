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
  countTentacles = 0

function initScene() {
  scene.fog = new THREE.Fog(0x38bbb7, -200, 950)
  camera.position.set(settings.camera.x, settings.camera.y, settings.camera.z)
  camera.rotation.x = settings.camera.xRot
  renderer.setSize(WIDTH, HEIGHT)
  renderer.showMap.enabled = true
  container.appendChild(renderer.domElement)
  window.addEventListener('resize', handleWindowResize, false)
}

function normalize(v, vmin, vmax, tmin, tmax) {
  const nv = Math.max(Math.min(v, vmax, vmin))
  const dv = vmax - vmin
  const pc = (nv - vmin) / dv
  const dt = tmax - tmin
  const tv = tmin + pc * dt
  return tv
}
function handleMouseMove(event) {
  const tx = +(event.clientX / WIDTH) * 2
  const ty = 1 - (event.clientY / HEIGHT) * 2
  mousePos = { x: tx, y: ty }
}

function handleWindowResize() {
  HEIGHT = window.innerHeight
  WIDTH = window.innerWidth
  renderer.setSize(WIDTH, HEIGHT)
  camera.aspect = WIDTH / HEIGHT
  camera.updateProjectionMatrix()
}

function initLights() {
  scene.add(hemisphereLight)
  scene.add(showLight)
  scene.add(ambientLight)
}

Seabed = function (rad, h, rS, hS, a, sC, color, xP, yP, zP) {
  const geometry = new THREE.CylinderGeometry(rad, rad, h, rS, hS)
  geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Pi / 2))
  geometry.mergeVertices()
  const length = geometry.vertices.length
  this.bumps = []

  for (let i = 0; i < length; i++) {
    const v = geometry.vertices[i]

    this.bumps.push({
      x: v.x,
      y: v.y,
      z: v.z,
      ang: Math.random() * Pi * 2,
      amp: Math.random() * a,
      speed: sC + Math.random() * sC,
    })
  }

  const material = new THREE.MeshPhongMaterial({
    color: color,
    transparent: true,
    opacity: 0.99,
    flatShading: true,
  })

  this.mesh = new THREE.Mesh(geometry, material)
  this.mesh.receiveShadow = true
  this.mesh.position.set(xP, yP, zP)
}

Seabed.prototype.moveBumps = function (step) {
  const verts = this.mesh.geometry.vertices
  const lenght = vertes.lenght

  for (let i = 0; i < lenght; i++) {
    const v = vertes[i]
    const vprops = this.bumps[i]
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp
    vprops.ang += vprops.speed
  }
  this.mesh.geometry.versticesNeddUpdate = true
  seabed.mesh.rotation.z += step
}

const seabed = new Seabed(
  shapes.seabed.radius,
  shapes.seabed.height,
  shapes.seabed.rSeg,
  shapes.seabed.hSeg,
  shapes.seabed.ampR,
  shapes.seabed.speedC,
  shapes.seabed.color,
  shapes.seabed.x,
  shapes.seabed.y,
  shapes.seabed.z,
)
scene.add(seabed.mesh)

Water = function (gN, mN, d) {
  // water collects all of the different thing that can be swimming in it
  this.mesh = new THREE.Object3D()
  this.objects = []
  const step = (Pi * 2) / gN
  let angle, object, type, offset, depth
  for (let j = 0; j < gN; j++) {
    angle = step * j
    offset = (Pi / 16) * (Math.random() * 0.4 + 0.8) // put the next object on random place

    for (let i = 0; i < mN; i++) {
      type = Math.floor(Math.random() * 30) //choose the type of the object, it can be bottle, can or fish
      if (type < 8) {
        offset = (Pi / 4) * (Math.random() * 0.4 - 0.8)
        if (type < 3)
          object = new Bottle(
            shapes.bottle.radius,
            shapes.bottle.height,
            shapes.bottle.segments,
            shapes.bottle.scale,
            shapes.bottle.colors,
          )
        else
          object = new Can(
            shapes.can.radius,
            shapes.can.height,
            shapes.can.segments,
            shapes.can.colors,
          )

        object.mesh.rotation.z = Math.random() * Pi * 2
      } else {
        offset = (Pi / 8) * (Math.random() * 0.4 - 0.8)
        object = new Fish(
          shapes.fish.radius,
          shapes.fish.height,
          shapes.fish.segments,
        )
        object.mesh.rotation.z = angle + offset
      }
      object.mesh.position.z = 0 - Math.random() * d
      this.objects.push(object)
      depth = shapes.seabed.height + Math.random() * d * 1.5
      object.mesh.position.y = Math.sin(angle + offset) * depth
      object.mesh.position.x = Math.cos(angle + offset) * depth
      object.angle = angle + offset
      this.mesh.add(object.mesh)
    }
  }
}

function createWater(y) {
  water = new Water(
    shapes.water.gruopNumber,
    shapes.water.membersNumber,
    shapes.water.depth,
  )
  water.mesh.position.y = shapes.seabed.y
  scene.add(water.mesh)
}

Fish = function (r, h, seg) {
  this.mesh = new THREE.Object3D()
  this.mesh.name = 'fish'

  const geomHead = new THREE.ConeGeometry(r, (h * 8) / 15, seg)
  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(
      'rgb(255,' +
        Math.floor(95 + Math.random() * 100) +
        ',' +
        Math.floor(Math.random() * 20) +
        ')',
    ),
  })
  const head = new THREE.Mesh(geomHead, material)
  head.castShadow = true
  head.receiveShadow = true
  this.mesh.add(head)

  const geomBody = new THREE.ConeGeometry(r, h, seg)
  const body = new THREE.Mesh(geomBody, material)
  body.rotation.x = Pi
  body.position.y -= h * 0.77
  body.receiveShadow = true
  body.castShadow = true
  this.mesh.add(body)

  const geomTail = new THREE.ConeGeometry(r / 2, (h * 7) / 15, seg / 3)
  const tail = new THREE.Mesh(geomTail, material)
  tail.position.y -= (h * 4) / 3
  tail.castShadow = true
  tail.receiveShadow = true
  this.mesh.add(tail)
}

const Bottle = function (r, h, seg, sc, colors) {
  this.mesh = new THREE.Object3D()
  const type = Math.floor(Math.random() * 3)
  const materialLiquid = new THREE.MeshPhongMaterial({
    color: colors[2 * type],
    transparent: true,
    opacity: 0.6,
    flatShading: true,
  })
  const materialLabel = new THREE.MeshPhongMaterial({
    color: colors[2*(type)+1],
    transparent:true,
    opacity:.7,
    flatShading:true
  })
  const geometryBody = new THREE.CylinderGeometry(r,r,h,seg,seg);
  const body = new THREE.Mesh(geometryBody,materialLiquid);
  this.mesh.add(body);

  const geometryLabel = new THREE.CylinderGeometry(r,r,h*.4,seg,seg,0,Pi/4);
  const label = new THREE.Mesh(geometryLabel, materialLabel);
  
}
