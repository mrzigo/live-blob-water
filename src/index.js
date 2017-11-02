import 'init'

const initialize = (params) => {
  if (!params.src)
    return console.warn('Нет исходного изображения')
  if (!params.sectors) || (params.sectors && params.sectors.length === 0)
    return console.warn('Не обазначена форма капли')
  if (!params.el)
    return console.warn('Нет jquery-елемента для вставки canvas')
  this.el = params.el
  this.src = params.src
  this.sectors = params.sectors
  this.cyclical = params.cyclical !== undefined ? params.cyclical : true
  this.speed = params.speed || 100
  this.width = params.width || 100
  this.height = params.height || 100
  this.left = params.left || '0px'
  this.top = params.top || '0px'
  this.center = params.center || [this.width / 2, this.height / 2]
  this.lightVector = [60, 60]
}

const getCoord = (A, A2B, B, t) => {
  // система уравнений кривой бизье по опорным точкам (A, A2B, B),
  //    где A начальная точка, B - кнечная точка, A2B - задающая кривизну, t ∈ [0,1]
  // x = (1−t)^2*x1 + 2(1−t)tx2 + t^2*x3
  // y = (1−t)^2*y1 + 2(1−t)ty2 + t^2*y3
  return [
    round( (1-t)*(1-t)*A[0] + 2*(1-t)*t*A2B[0] + t*t*B[0] ), // x
    round( (1-t)*(1-t)*A[1] + 2*(1-t)*t*A2B[1] + t*t*B[1] ), // y
  ]
}

const point = (x, y, a, k) => {
  const index = (x + y * this.width) * 4
  // в точке уже что то есть и там прозрачность выше, значит не трогаем
  if ((data[index + 3] > 0) && (data[index + 3] >= a)) return
  data[index + 0] = r // red
  data[index + 1] = g // green
  data[index + 2] = b // blue
  data[index + 3] = a // alfa
}

const pencil = (point, r, g, b, a, layout = 'lens') {
  let data = this.layout[layout].data
  const a2 = a/2
  const [x, y] = point
  const [xp, yp] = [point[0]+1, point[1]+1]
  const [xm, ym] = [point[0]-1, point[1]-1]
  // создаем "мягкую точку" - края с полупрозрачностью
  this.point(xm, ym, a2)
  this.point(x,  ym, a2)
  this.point(xp, ym, a2)
  this.point(xm, y,  a2)
  this.point(x,  y,   a)
  this.point(xp, y,   a)
  this.point(xm, yp, a2)
  this.point(x,  yp, a2)
  this.point(xp, yp, a2)
}

// выполняет искажение изображение
const lensEffect = (B) => {
  const [x1, y1] = this.center
  const [x2, y2] = B
  const length = lengthVector([x1, y1], B)
  const data = this.layout.origin.data
  const a = atan2(y2-y1, x2-x1)
  for (let r = 0; r <= length; r = r + 1) {
    const [x, y] = [round(x1+cos(a)*r), round(y1+sin(a)*r)]
    const k = (r / length) * (r / length) * 0.2 + 1 // коэфициент линзы
    const [originX, originY] = [round(x1+cos(a)*r*k), round(y1+sin(a)*r*k)]
    const origin = (originX + originY * this.width) * 4
    this.pencil(indexFigure,
      [x, y],
      data[origin + 0],
      data[origin + 1],
      data[origin + 2],
      data[origin + 3],
      'lens',
    )
  }
}

// Рисует окантовку капли
const cant = (P, O) => {
  // добавить параметр что бы рисовать?
  const nextP = this.getDelta(P, 1, atan2(P[1]-O[1], P[1]-O[0]))
  this.pencil([nextP.x, nextP.y], 100, 100, 100, 100, 'lens')
}

// рисует кривую Безье по трем опорным точкам
const curve = (A, A2B, B) => {
  const { center: O } = this
  for (let t = 0; t <= 1; t = t + 0.02) {
    const P = this.getCoord(A, A2B, B, t)
    this.lensEffect(P)
    this.cant(P, O)
  }
}

// Рисует тень по кривой Безье через три опорные точки
const dark = (A, A2B, B) => {
  const { center: O, darkData, lightParams: { length, offset, alfa } } = this
  const [kcos, ksin] = [cos(alfa)*offset, sin(alfa)*offset]
  for (let t = 0; t <= 1; t = t + 0.01) {
    const [px, py] = this.getCoord(A, A2B, B, t)
    for (let r = 0; r <= length; r = r + 1) {
      const [x, y] = [round(px+cos(alfa)*r), round(py+sin(alfa)*r)]
      const k = 0.95 - (r / length) * (r / length) * 0.8 * sqrt(r/length)  //
      this.pencil(indexFigure, [x, y], 110, 110, 110, k * 80, 'dark')
    }
  }
}

// Удаляет все с холста
const clear = () => {
  const { width, height, layout } = this
  const clear = (layout, index) => {
    layout.data[index + 0] = 0
    layout.data[index + 1] = 0
    layout.data[index + 2] = 0
    layout.data[index + 3] = 0
  }
  for (let y = 0; y < height; y++ ) {
    for (let x = 0; x < width; x++ ) {
      const index = (x + y * height) * 4
      clear(layout.lens, index)
      clear(layout.dark, index)
      clear(layout.glare, index)
    }
  }
}

// Получает текущий радиус капли, также возвращает координату пересечения вектора света с границей капли
const getRadius = (indexFigure, alfa = 0) => {
  const {
    layout: {lens: {data}},
    center: O,
    lightVector: V,
    width
  } = this.figure[indexFigure]
  const [x1, y1] = O
  const a = atan2(V[1]-y1, V[0]-x1) + PI + alfa
  const length = lengthVector(O, V) // если перейти на смещение тени на длинну вектора, тут длинну сменить на ширину картинки
  let len = 0, resP, P
  for (let r = 0; r <= width; r++) {
    P = this.getDelta(O, r, a)
    const index = (P[0] + P[1] * width) * 4
    if (data[index + 3] >= 254) {
      len = r
      resP = P
    }
  }
  return {
    length: len, // длинна радиуса
    coord: resP, // координаты границы
    alfa: a - PI, // угол наклона вектора
  }
}

// рисует блик
const glare () => {
  const figure = this
  if (this.glare === false) return false // no undefined
  const radius = this.getRadius(indexFigure)
  if (radius.length > 0) {
    const radius1 = this.getRadius(indexFigure, -PI/10)
    const radius2 = this.getRadius(indexFigure, +PI/10)
    const lightLen = this.lightParams.length / 6 // сдвиг блика
    this.context.glare.clearRect(0,0, this.width, this.height)

    const O = this.getDelta(radius.coord, lightLen-lightLen/4, radius.alfa)  // центр овала
    const A = this.getDelta(radius1.coord, lightLen, radius1.alfa)
    const B = this.getDelta(radius2.coord, lightLen, radius2.alfa)
    const C = this.getDelta(O, lightLen*2, radius.alfa-PI)
    const D = this.getDelta(O, lightLen*2, radius.alfa)
    this.context.glare.beginPath()
    this.context.glare.moveTo(A[0], A[1])
    this.context.glare.quadraticCurveTo(C[0], C[1], B[0], B[1])
    this.context.glare.quadraticCurveTo(D[0], D[1], A[0], A[1])
    // this.context.glare.globalAlpha=0.9
    this.context.glare.filter='blur(1px)'
    this.context.glare.fillStyle = '#FFFFFF'
    this.context.glare.fill()
  }
}

const genNextPoint = (data, pointName, index) => {
  let [A, B, t, step = 0.01] = data
  const [x1, y1] = A
  const [x2, y2] = B
  const [dx, dy] = [x2-x1, y2-y1]
  const length = sqrt(dx*dx + dy*dy) // длинна отрезка AB
  const a = atan2(y2-y1, x2-x1)
  if (pointName) {
    this.sectors[index][pointName][2] = t + step
    if ((this.sectors[index][pointName][2] < 0) ||
        (this.sectors[index][pointName][2] > 1)) {
      this.sectors[index][pointName][3] = this.sectors[index][pointName][3] * -1
    }
  }
  return [round(x1+cos(a)*t*length), round(y1+sin(a)*t*length)]
}

// проверяет, не нужно ли остановить анимацию
const isStopAnimation = () => {
  if (this.cyclical) return false
  const steps = this.sectors.map(({a,b,c}) => {
    let arr = []
    if (a) arr.push(a[2])
    if (b) arr.push(b[2])
    if (c) arr.push(c[2])
    return Math.min.apply( Math, arr )
  })
  if (Math.min.apply( Math, steps ) >= 1) clearInterval(this.id)
}

// Генерирует опорные точки капли через центр и радиус
// Радиус должен быть <= 1/3 ширины(ширина===высота) canvas области
const genReferencePoints = () => {
  let points = [], first, last
  const len = this.sectors.length
  for (let i = 0; i < len; i++) {
    const sector = this.sectors[i]
    first = first ? first : this.genNextPoint(index, sector.a, 'a', i)
    const res = {
      a: sector.a ? this.genNextPoint(index, sector.a, 'a', i) : last,
      b: this.genNextPoint(index, sector.b, 'b', i),
      c: sector.c ? this.genNextPoint(index, sector.c, 'c', i) : first,
    }
    last = sector.c ? this.genNextPoint(index, sector.c, 'c', i) : last
    points.push(res)
  }
  return points
}

const animation = () => {
  const points = this.genReferencePoints()
  this.context.lens.putImageData(this.layout.origin, 0, 0)
  points.forEach(sector => this.curve(sector.a, sector.b, sector.c))
  points.forEach(sector => this.dark(sector.a, sector.b, sector.c))
  this.glare()
  this.context.lens.putImageData(this.layout.lens, 0, 0)
  this.context.dark.putImageData(this.layout.dark, 0, 0)
  this.isStopAnimation()
  this.clear()
}

const generateCanvas = (top, left, width, height) => {
  let canvas = document.createElement('canvas')
  canvas.style.left = left
  canvas.style.top = top
  canvas.style.position = 'absolute'
  canvas.width = width
  canvas.height = height
  return canvas
}

const render = () => {
  const [x1, y1] = this.center
  const [x2, y2] = this.lightVector
  const [dx, dy] = [x2-x1, y2-y1]
  const lengthVector = sqrt(dx*dx + dy*dy) // длинна вектора света
  this.image = new Image()
  this.image.src = f.src
  this.canvas = {
    lens: this.generateCanvas(this.top, this.left, this.width, this.height), // линза
    dark: this.generateCanvas(this.top, this.left, this.width, this.height), // тень
    glare: this.generateCanvas(this.top, this.left, this.width, this.height), // блик
  }

  this.context = {
    lens: this.canvas.lens.getContext('2d'),
    dark: this.canvas.dark.getContext('2d'),
    glare: this.canvas.glare.getContext('2d'),
  }
  this.lightParams = { // параметры тени
    length: lengthVector, // длинна
    offset: lengthVector, // смещение
    alfa: atan2(dy, dx), // угол наклона
  }
  this.image.onload = () => {
    f.layout = {
      lens: this.context.lens.getImageData(0, 0, this.width, this.height),
      dark: this.context.lens.getImageData(0, 0, this.width, this.height),
      glare: this.context.lens.getImageData(0, 0, this.width, this.height),
    }
    this.context.lens.drawImage(this.image, 0, 0)
    this.layout.origin = this.context.lens.getImageData(0, 0, this.width, this.height)
    this.id = setInterval(() => this.animation(i), this.speed)
    this.animation(i)
  }
  this.el.append(this.canvas.lens)
  this.el.append(this.canvas.dark)
  this.el.append(this.canvas.glare)
}


const Drop = (params) => {
  this.initialize = initialize.bind(this)
  this.getCoord = getCoord.bind(this)
  this.point = point.bind(this)
  this.pencil = pencil.bind(this)
  this.lensEffect = lensEffect.bind(this)
  this.cant = cant.bind(this)
  this.curve = curve.bind(this)
  this.dark = dark.bind(this)
  this.clear = clear.bind(this)
  this.getRadius = getRadius.bind(this)
  this.getDelta = getDelta.bind(this)
  this.glare = glare.bind(this)
  this.getDotOnLine = getDotOnLine.bind(this)
  this.genNextPoint = genNextPoint.bind(this)
  this.isStopAnimation = isStopAnimation.bind(this)
  this.genReferencePoints = genReferencePoints.bind(this)
  this.animation = animation.bind(this)
  this.generateCanvas = generateCanvas.bind(this)
  this.render = render.bind(this)

  this.initialize(params)
  this.render()
}

export default Drop
