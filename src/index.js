import html2canvas from 'html2canvas'
import {
  sqrt,
  round,
  sin,
  cos,
  atan2,
  PI,
  lengthVector,
  max,
  min,
  getDelta,
  getCoord,
} from './math'

class Blob {
  constructor(params) {
    this.initialize = this.initialize.bind(this)
    this.point = this.point.bind(this)
    this.pencil = this.pencil.bind(this)
    this.lensEffect = this.lensEffect.bind(this)
    this.cant = this.cant.bind(this)
    this.curve = this.curve.bind(this)
    this.dark = this.dark.bind(this)
    this.clear = this.clear.bind(this)
    this.getRadius = this.getRadius.bind(this)
    this.glare = this.glare.bind(this)
    this.genNextPoint = this.genNextPoint.bind(this)
    this.isStopAnimation = this.isStopAnimation.bind(this)
    this.genReferencePoints = this.genReferencePoints.bind(this)
    this.animation = this.animation.bind(this)
    this.generateCanvas = this.generateCanvas.bind(this)
    this.loadImage = this.loadImage.bind(this)
    this.render = this.render.bind(this)
    window.requestAnimFrame = window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.oRequestAnimationFrame ||
                            window.msRequestAnimationFrame ||
                            ((callback, element) => {window.setTimeout(callback, 1000/60)})
    this.initialize(params)
  }

  initialize(params) {
    if (!params.in || !(params.in && params.in[0]))
      return console.warn('Нет исходного jquery-елемента')
    if ((!params.sectors) || (params.sectors && params.sectors.length === 0))
      return console.warn('Не обазначена форма капли')
    this.el = params.out ? params.out : params.in // разместить там же или в новое место
    this.src = params.in
    this.sectors = params.sectors
    this.cyclical = params.cyclical !== undefined ? params.cyclical : true
    this.glarePrint = params.glare !== undefined ? params.glare : true
    this.stepBezier = params.stepBezier !== undefined ? params.stepBezier : 0.02
    this.width = params.width || 100
    this.height = params.height || 100
    this.left = params.left || 0
    this.top = params.top || 0
    this.kofLens = params.lens ||  0.2
    this.center = params.center || [this.width / 2, this.height / 2]
    this.lightVector = params.lightVector || [this.width / 2 + this.width / 12, this.height / 2 + this.width / 12]
    this.render()
  }

  point(data, x, y, r, g, b, a) {
    const index = (x + y * this.width) * 4
    // в точке уже что то есть и там прозрачность выше, значит не трогаем
    if ((data[index + 3] > 0) && (data[index + 3] >= a)) return
    data[index + 0] = r // red
    data[index + 1] = g // green
    data[index + 2] = b // blue
    data[index + 3] = a // alfa
  }

  pencil(point, r, g, b, a, layout = 'lens') {
    let data = this.layout[layout].data
    const a2 = a/2
    const [x, y] = point
    const [xp, yp] = [point[0]+1, point[1]+1]
    const [xm, ym] = [point[0]-1, point[1]-1]
    // создаем "мягкую точку" - края с полупрозрачностью
    this.point(data, xm, ym, r, g, b, a2)
    this.point(data, x,  ym, r, g, b, a2)
    this.point(data, xp, ym, r, g, b, a2)
    this.point(data, xm, y,  r, g, b, a2)
    this.point(data, x,  y,  r, g, b,  a)
    this.point(data, xp, y,  r, g, b,  a)
    this.point(data, xm, yp, r, g, b, a2)
    this.point(data, x,  yp, r, g, b, a2)
    this.point(data, xp, yp, r, g, b, a2)
  }

  // выполняет искажение изображение
  lensEffect(B) {
    const [x1, y1] = this.center
    const [x2, y2] = B
    const length = lengthVector([x1, y1], B)
    const data = this.layout.origin.data
    const a = atan2(y2-y1, x2-x1)
    for (let r = 0; r <= length; r = r + 1) {
      const [x, y] = [round(x1+cos(a)*r), round(y1+sin(a)*r)]
      const k = (r / length) * (r / length) * this.kofLens + 1 // коэфициент линзы
      const [originX, originY] = [round(x1+cos(a)*r*k), round(y1+sin(a)*r*k)]
      const origin = (originX + originY * this.width) * 4
      this.pencil(
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
  cant(P, O) {
    // TODO добавить параметр рисовать/не рисовать?
    const nextP = getDelta(P, 1, atan2(P[1]-O[1], P[1]-O[0]))
    this.pencil([nextP.x, nextP.y], 100, 100, 100, 100, 'lens')
  }

  // рисует кривую Безье по трем опорным точкам
  curve(A, A2B, B) {
    const { center: O } = this
    const step = this.stepBezier
    for (let t = 0; t <= 1; t = t + step) {
      const P = getCoord(A, A2B, B, t)
      this.lensEffect(P)
      this.cant(P, O)
    }
  }

  // Рисует тень по кривой Безье через три опорные точки
  dark(A, A2B, B) {
    const { lightParams: { length, alfa } } = this
    for (let t = 0; t <= 1; t = t + 0.01) {
      const [px, py] = getCoord(A, A2B, B, t)
      for (let r = 0; r <= length; r = r + 1) {
        const [x, y] = [round(px+cos(alfa)*r), round(py+sin(alfa)*r)]
        const k = 0.95 - (r / length) * (r / length) * 0.8 * sqrt(r/length)  //
        this.pencil([x, y], 110, 110, 110, k * 80, 'dark')
      }
    }
  }

  // Удаляет все с холста
  clear() {
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
  getRadius(alfa = 0) {
    const {
      layout: {lens: {data}},
      center: O,
      lightVector: V,
      width
    } = this
    const [x1, y1] = O
    const a = atan2(V[1]-y1, V[0]-x1) + PI + alfa
    let len = 0, resP, P
    for (let r = 0; r <= width; r++) {
      P = getDelta(O, r, a)
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
  glare() {
    if (this.glarePrint === false) return false // no undefined
    const radius = this.getRadius()
    const radius1 = this.getRadius(-PI/10)
    const radius2 = this.getRadius(+PI/10)
    if ((radius.length > 0) && (radius1.length > 0) && (radius2.length > 0)) {
      const lightLen = this.lightParams.length / 6 // сдвиг блика
      this.context.glare.clearRect(0,0, this.width, this.height)

      const O = getDelta(radius.coord, lightLen-lightLen/4, radius.alfa)  // центр овала
      const A = getDelta(radius1.coord, lightLen, radius1.alfa)
      const B = getDelta(radius2.coord, lightLen, radius2.alfa)
      const C = getDelta(O, lightLen*2, radius.alfa-PI)
      const D = getDelta(O, lightLen*2, radius.alfa)
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

  genNextPoint(data, pointName, index) {
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
  isStopAnimation() {
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
  genReferencePoints() {
    let points = [], first, last
    const len = this.sectors.length
    for (let i = 0; i < len; i++) {
      const sector = this.sectors[i]
      first = first ? first : this.genNextPoint(sector.a, 'a', i)
      const res = {
        a: sector.a ? this.genNextPoint(sector.a, 'a', i) : last,
        b: this.genNextPoint(sector.b, 'b', i),
        c: sector.c ? this.genNextPoint(sector.c, 'c', i) : first,
      }
      last = sector.c ? this.genNextPoint(sector.c, 'c', i) : last
      points.push(res)
    }
    return points
  }

  animation() {
    if (this.cyclical) {
      window.requestAnimFrame(this.animation)
    }
    const points = this.genReferencePoints()
    this.context.lens.putImageData(this.layout.origin, 0, 0)
    points.forEach(sector => this.curve(sector.a, sector.b, sector.c)) // TODO разделить на кривую и линзу
    points.forEach(sector => this.dark(sector.a, sector.b, sector.c))
    this.glare()
    this.context.lens.putImageData(this.layout.lens, 0, 0)
    this.context.dark.putImageData(this.layout.dark, 0, 0)
    this.isStopAnimation()
    this.clear()
  }

  generateCanvas(top, left, width, height) {
    let canvas = document.createElement('canvas')
    canvas.style.left = left instanceof String ? left : left + 'px'
    canvas.style.top = top instanceof String ? top : top + 'px'
    canvas.style.position = 'absolute'
    canvas.width = width
    canvas.height = height
    return canvas
  }

  loadImage() {
    this.context.lens.drawImage(this.image, this.left, this.top, this.width, this.height, 0, 0, this.width, this.height)
    this.layout.origin = this.context.lens.getImageData(0, 0, this.width, this.height)
    this.animation()
    this.el.append(this.canvas.lens) // отдаем наложение слоев браузеру
    this.el.append(this.canvas.dark)
    this.el.append(this.canvas.glare)
  }

  render() {
    const [x1, y1] = this.center
    const [x2, y2] = this.lightVector
    const [dx, dy] = [x2-x1, y2-y1]
    const lengthVector = sqrt(dx*dx + dy*dy) // длинна вектора света
    this.image = new Image()
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
      alfa: atan2(dy, dx), // угол наклона
    }
    setTimeout(() => {
      if (!this.src || !(this.src && this.src[0])) return null
      html2canvas(this.src, {
        onrendered: (canvas) => {
          this.layout = {
            lens: this.context.lens.getImageData(0, 0, this.width, this.height),
            dark: this.context.lens.getImageData(0, 0, this.width, this.height),
            glare: this.context.lens.getImageData(0, 0, this.width, this.height),
          }
          this.image.src = canvas.toDataURL()
          this.image.onload = this.loadImage
        }
      })
    }, 1)
  }

  destroy() {
    clearInterval(this.id)
    window.requestAnimFrame(() => { // отложить удаление до завершения анимации
      this.cyclical = false
      this.canvas.lens.remove()
      this.canvas.dark.remove()
      this.canvas.glare.remove()
      delete this.canvas
      delete this.layout
      delete this.context
      delete this.image
      delete this.sectors
      delete this.cyclical
      delete this.glarePrint
      delete this.stepBezier
      delete this.width
      delete this.height
      delete this.left
      delete this.top
      delete this.kofLens
      delete this.center
      delete this.lightVector
    })
  }

}

export default Blob
