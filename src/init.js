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

// Получает x или y на прямой проходящей через точки A и B
const getDotOnLine = (A,B,x,y) => {
  const [x1, y1] = A
  const [x2, y2] = B
  if (x) return [x, round((x2*y1 - x1*y2 - (y1-y2)*x)/(x2-x1))] // знаем x
  return [round((x2*y1 - x1*y2 - (x2-x1)*y)/(y1-y2)), y] // Знаем y
}
