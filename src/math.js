const sqrt = Math.sqrt
const round = Math.round
// const rnd = Math.random
const sin = Math.sin
const cos = Math.cos
const atan2 = Math.atan2
const PI = Math.PI
const lengthVector = (A,B) => sqrt((B[0]-A[0])*(B[0]-A[0])+(B[1]-A[1])*(B[1]-A[1]))
const max = (array) => Math.max.apply( Math, array )
const min = (array) => Math.min.apply( Math, array )

// Получает смещение точки А на длинну len от точки A (alfa - угол наклона)
const getDelta = (A, len, alfa) => {
  return [
    round(A[0]+cos(alfa)*len),
    round(A[1]+sin(alfa)*len),
  ]
}

// // Получает x или y на прямой проходящей через точки A и B
// const getDotOnLine = (A,B,x,y) => {
//   const [x1, y1] = A
//   const [x2, y2] = B
//   if (x) return [x, round((x2*y1 - x1*y2 - (y1-y2)*x)/(x2-x1))] // знаем x
//   return [round((x2*y1 - x1*y2 - (x2-x1)*y)/(y1-y2)), y] // Знаем y
// }

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

export {
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
  // getDotOnLine,
  getCoord,
}
