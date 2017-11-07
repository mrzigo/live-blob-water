'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _html2canvas = require('html2canvas');

var _html2canvas2 = _interopRequireDefault(_html2canvas);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var sqrt = Math.sqrt;
var round = Math.round;
// const rnd = Math.random
var sin = Math.sin;
var cos = Math.cos;
var atan2 = Math.atan2;
var PI = Math.PI;
var lengthVector = function lengthVector(A, B) {
  return sqrt((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]));
};
// Получает смещение точки А на длинну len от точки A (alfa - угол наклона)
var getDelta = function getDelta(A, len, alfa) {
  return [round(A[0] + cos(alfa) * len), round(A[1] + sin(alfa) * len)];
};

// // Получает x или y на прямой проходящей через точки A и B
// const getDotOnLine = (A,B,x,y) => {
//   const [x1, y1] = A
//   const [x2, y2] = B
//   if (x) return [x, round((x2*y1 - x1*y2 - (y1-y2)*x)/(x2-x1))] // знаем x
//   return [round((x2*y1 - x1*y2 - (x2-x1)*y)/(y1-y2)), y] // Знаем y
// }

var getCoord = function getCoord(A, A2B, B, t) {
  // система уравнений кривой бизье по опорным точкам (A, A2B, B),
  //    где A начальная точка, B - кнечная точка, A2B - задающая кривизну, t ∈ [0,1]
  // x = (1−t)^2*x1 + 2(1−t)tx2 + t^2*x3
  // y = (1−t)^2*y1 + 2(1−t)ty2 + t^2*y3
  return [round((1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * A2B[0] + t * t * B[0]), // x
  round((1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * A2B[1] + t * t * B[1])];
};

var Dlob = function () {
  function Dlob(params) {
    _classCallCheck(this, Dlob);

    this.initialize = this.initialize.bind(this);
    this.point = this.point.bind(this);
    this.pencil = this.pencil.bind(this);
    this.lensEffect = this.lensEffect.bind(this);
    this.cant = this.cant.bind(this);
    this.curve = this.curve.bind(this);
    this.dark = this.dark.bind(this);
    this.clear = this.clear.bind(this);
    this.getRadius = this.getRadius.bind(this);
    this.glare = this.glare.bind(this);
    this.genNextPoint = this.genNextPoint.bind(this);
    this.isStopAnimation = this.isStopAnimation.bind(this);
    this.genReferencePoints = this.genReferencePoints.bind(this);
    this.animation = this.animation.bind(this);
    this.generateCanvas = this.generateCanvas.bind(this);
    this.loadImage = this.loadImage.bind(this);
    this.render = this.render.bind(this);
    this.initialize(params);
  }

  _createClass(Dlob, [{
    key: 'initialize',
    value: function initialize(params) {
      if (!params.in) return console.warn('Нет исходного jquery-елемента');
      if (!params.sectors || params.sectors && params.sectors.length === 0) return console.warn('Не обазначена форма капли');
      this.el = params.out ? params.out : params.in; // разместить там же или в новое место
      this.src = params.in;
      this.sectors = params.sectors;
      this.cyclical = params.cyclical !== undefined ? params.cyclical : true;
      this.glarePrint = params.glare !== undefined ? params.glare : true;
      this.speed = params.speed || 100;
      this.width = params.width || 100;
      this.height = params.height || 100;
      this.left = params.left || 0;
      this.top = params.top || 0;
      this.kof_lens = params.lens || 0.2;
      this.center = params.center || [this.width / 2, this.height / 2];
      this.lightVector = params.lightVector || [this.width / 2 + 10, this.height / 2 + 10];
      this.render();
    }
  }, {
    key: 'point',
    value: function point(data, x, y, r, g, b, a) {
      var index = (x + y * this.width) * 4;
      // в точке уже что то есть и там прозрачность выше, значит не трогаем
      if (data[index + 3] > 0 && data[index + 3] >= a) return;
      data[index + 0] = r; // red
      data[index + 1] = g; // green
      data[index + 2] = b; // blue
      data[index + 3] = a; // alfa
    }
  }, {
    key: 'pencil',
    value: function pencil(point, r, g, b, a) {
      var layout = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 'lens';

      var data = this.layout[layout].data;
      var a2 = a / 2;

      var _point = _slicedToArray(point, 2),
          x = _point[0],
          y = _point[1];

      var xp = point[0] + 1,
          yp = point[1] + 1;
      var xm = point[0] - 1,
          ym = point[1] - 1;
      // создаем "мягкую точку" - края с полупрозрачностью

      this.point(data, xm, ym, r, g, b, a2);
      this.point(data, x, ym, r, g, b, a2);
      this.point(data, xp, ym, r, g, b, a2);
      this.point(data, xm, y, r, g, b, a2);
      this.point(data, x, y, r, g, b, a);
      this.point(data, xp, y, r, g, b, a);
      this.point(data, xm, yp, r, g, b, a2);
      this.point(data, x, yp, r, g, b, a2);
      this.point(data, xp, yp, r, g, b, a2);
    }

    // выполняет искажение изображение

  }, {
    key: 'lensEffect',
    value: function lensEffect(B) {
      var _center = _slicedToArray(this.center, 2),
          x1 = _center[0],
          y1 = _center[1];

      var _B = _slicedToArray(B, 2),
          x2 = _B[0],
          y2 = _B[1];

      var length = lengthVector([x1, y1], B);
      var data = this.layout.origin.data;
      var a = atan2(y2 - y1, x2 - x1);
      for (var r = 0; r <= length; r = r + 1) {
        var _ref = [round(x1 + cos(a) * r), round(y1 + sin(a) * r)],
            x = _ref[0],
            y = _ref[1];

        var k = r / length * (r / length) * this.kof_lens + 1; // коэфициент линзы
        var _ref2 = [round(x1 + cos(a) * r * k), round(y1 + sin(a) * r * k)],
            originX = _ref2[0],
            originY = _ref2[1];

        var origin = (originX + originY * this.width) * 4;
        this.pencil([x, y], data[origin + 0], data[origin + 1], data[origin + 2], data[origin + 3], 'lens');
      }
    }

    // Рисует окантовку капли

  }, {
    key: 'cant',
    value: function cant(P, O) {
      // TODO добавить параметр рисовать/не рисовать?
      var nextP = getDelta(P, 1, atan2(P[1] - O[1], P[1] - O[0]));
      this.pencil([nextP.x, nextP.y], 100, 100, 100, 100, 'lens');
    }

    // рисует кривую Безье по трем опорным точкам

  }, {
    key: 'curve',
    value: function curve(A, A2B, B) {
      var O = this.center;

      for (var t = 0; t <= 1; t = t + 0.02) {
        var P = getCoord(A, A2B, B, t);
        this.lensEffect(P);
        this.cant(P, O);
      }
    }

    // Рисует тень по кривой Безье через три опорные точки

  }, {
    key: 'dark',
    value: function dark(A, A2B, B) {
      var O = this.center,
          darkData = this.darkData,
          _lightParams = this.lightParams,
          length = _lightParams.length,
          offset = _lightParams.offset,
          alfa = _lightParams.alfa;
      var kcos = cos(alfa) * offset,
          ksin = sin(alfa) * offset;

      for (var t = 0; t <= 1; t = t + 0.01) {
        var _getCoord = getCoord(A, A2B, B, t),
            _getCoord2 = _slicedToArray(_getCoord, 2),
            px = _getCoord2[0],
            py = _getCoord2[1];

        for (var r = 0; r <= length; r = r + 1) {
          var _ref3 = [round(px + cos(alfa) * r), round(py + sin(alfa) * r)],
              x = _ref3[0],
              y = _ref3[1];

          var k = 0.95 - r / length * (r / length) * 0.8 * sqrt(r / length); //
          this.pencil([x, y], 110, 110, 110, k * 80, 'dark');
        }
      }
    }

    // Удаляет все с холста

  }, {
    key: 'clear',
    value: function clear() {
      var width = this.width,
          height = this.height,
          layout = this.layout;

      var clear = function clear(layout, index) {
        layout.data[index + 0] = 0;
        layout.data[index + 1] = 0;
        layout.data[index + 2] = 0;
        layout.data[index + 3] = 0;
      };
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var index = (x + y * height) * 4;
          clear(layout.lens, index);
          clear(layout.dark, index);
          clear(layout.glare, index);
        }
      }
    }

    // Получает текущий радиус капли, также возвращает координату пересечения вектора света с границей капли

  }, {
    key: 'getRadius',
    value: function getRadius() {
      var alfa = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var data = this.layout.lens.data,
          O = this.center,
          V = this.lightVector,
          width = this.width;

      var _O = _slicedToArray(O, 2),
          x1 = _O[0],
          y1 = _O[1];

      var a = atan2(V[1] - y1, V[0] - x1) + PI + alfa;
      var length = lengthVector(O, V); // если перейти на смещение тени на длинну вектора, тут длинну сменить на ширину картинки
      var len = 0,
          resP = void 0,
          P = void 0;
      for (var r = 0; r <= width; r++) {
        P = getDelta(O, r, a);
        var index = (P[0] + P[1] * width) * 4;
        if (data[index + 3] >= 254) {
          len = r;
          resP = P;
        }
      }
      return {
        length: len, // длинна радиуса
        coord: resP, // координаты границы
        alfa: a - PI // угол наклона вектора
      };
    }

    // рисует блик

  }, {
    key: 'glare',
    value: function glare() {
      if (this.glarePrint === false) return false; // no undefined
      var radius = this.getRadius();
      var radius1 = this.getRadius(-PI / 10);
      var radius2 = this.getRadius(+PI / 10);
      if (radius.length > 0 && radius1.length > 0 && radius2.length > 0) {
        var lightLen = this.lightParams.length / 6; // сдвиг блика
        this.context.glare.clearRect(0, 0, this.width, this.height);

        var O = getDelta(radius.coord, lightLen - lightLen / 4, radius.alfa); // центр овала
        var A = getDelta(radius1.coord, lightLen, radius1.alfa);
        var B = getDelta(radius2.coord, lightLen, radius2.alfa);
        var C = getDelta(O, lightLen * 2, radius.alfa - PI);
        var D = getDelta(O, lightLen * 2, radius.alfa);
        this.context.glare.beginPath();
        this.context.glare.moveTo(A[0], A[1]);
        this.context.glare.quadraticCurveTo(C[0], C[1], B[0], B[1]);
        this.context.glare.quadraticCurveTo(D[0], D[1], A[0], A[1]);
        // this.context.glare.globalAlpha=0.9
        this.context.glare.filter = 'blur(1px)';
        this.context.glare.fillStyle = '#FFFFFF';
        this.context.glare.fill();
      }
    }
  }, {
    key: 'genNextPoint',
    value: function genNextPoint(data, pointName, index) {
      var _data = _slicedToArray(data, 4),
          A = _data[0],
          B = _data[1],
          t = _data[2],
          _data$ = _data[3],
          step = _data$ === undefined ? 0.01 : _data$;

      var _A = _slicedToArray(A, 2),
          x1 = _A[0],
          y1 = _A[1];

      var _B2 = _slicedToArray(B, 2),
          x2 = _B2[0],
          y2 = _B2[1];

      var dx = x2 - x1,
          dy = y2 - y1;

      var length = sqrt(dx * dx + dy * dy); // длинна отрезка AB
      var a = atan2(y2 - y1, x2 - x1);
      if (pointName) {
        this.sectors[index][pointName][2] = t + step;
        if (this.sectors[index][pointName][2] < 0 || this.sectors[index][pointName][2] > 1) {
          this.sectors[index][pointName][3] = this.sectors[index][pointName][3] * -1;
        }
      }
      return [round(x1 + cos(a) * t * length), round(y1 + sin(a) * t * length)];
    }

    // проверяет, не нужно ли остановить анимацию

  }, {
    key: 'isStopAnimation',
    value: function isStopAnimation() {
      if (this.cyclical) return false;
      var steps = this.sectors.map(function (_ref4) {
        var a = _ref4.a,
            b = _ref4.b,
            c = _ref4.c;

        var arr = [];
        if (a) arr.push(a[2]);
        if (b) arr.push(b[2]);
        if (c) arr.push(c[2]);
        return Math.min.apply(Math, arr);
      });
      if (Math.min.apply(Math, steps) >= 1) clearInterval(this.id);
    }

    // Генерирует опорные точки капли через центр и радиус
    // Радиус должен быть <= 1/3 ширины(ширина===высота) canvas области

  }, {
    key: 'genReferencePoints',
    value: function genReferencePoints() {
      var points = [],
          first = void 0,
          last = void 0;
      var len = this.sectors.length;
      for (var i = 0; i < len; i++) {
        var sector = this.sectors[i];
        first = first ? first : this.genNextPoint(sector.a, 'a', i);
        var res = {
          a: sector.a ? this.genNextPoint(sector.a, 'a', i) : last,
          b: this.genNextPoint(sector.b, 'b', i),
          c: sector.c ? this.genNextPoint(sector.c, 'c', i) : first
        };
        last = sector.c ? this.genNextPoint(sector.c, 'c', i) : last;
        points.push(res);
      }
      return points;
    }
  }, {
    key: 'animation',
    value: function animation() {
      var _this = this;

      var points = this.genReferencePoints();
      this.context.lens.putImageData(this.layout.origin, 0, 0);
      points.forEach(function (sector) {
        return _this.curve(sector.a, sector.b, sector.c);
      }); // TODO разделить на кривую и линзу
      points.forEach(function (sector) {
        return _this.dark(sector.a, sector.b, sector.c);
      });
      this.glare();
      this.context.lens.putImageData(this.layout.lens, 0, 0);
      this.context.dark.putImageData(this.layout.dark, 0, 0);
      this.isStopAnimation();
      this.clear();
    }
  }, {
    key: 'generateCanvas',
    value: function generateCanvas(top, left, width, height) {
      var canvas = document.createElement('canvas');
      canvas.style.left = left instanceof String ? left : left + 'px';
      canvas.style.top = top instanceof String ? top : top + 'px';
      canvas.style.position = 'absolute';
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
  }, {
    key: 'loadImage',
    value: function loadImage() {
      var _this2 = this;

      this.context.lens.drawImage(this.image, this.left, this.top, this.width, this.height, 0, 0, this.width, this.height);
      this.layout.origin = this.context.lens.getImageData(0, 0, this.width, this.height);
      this.id = setInterval(function () {
        return _this2.animation();
      }, this.speed);
      this.animation();
      this.el.append(this.canvas.lens); // отдаем наложение слоев браузеру
      this.el.append(this.canvas.dark);
      this.el.append(this.canvas.glare);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      var _center2 = _slicedToArray(this.center, 2),
          x1 = _center2[0],
          y1 = _center2[1];

      var _lightVector = _slicedToArray(this.lightVector, 2),
          x2 = _lightVector[0],
          y2 = _lightVector[1];

      var dx = x2 - x1,
          dy = y2 - y1;

      var lengthVector$$1 = sqrt(dx * dx + dy * dy); // длинна вектора света
      this.image = new Image();
      this.canvas = {
        lens: this.generateCanvas(this.top, this.left, this.width, this.height), // линза
        dark: this.generateCanvas(this.top, this.left, this.width, this.height), // тень
        glare: this.generateCanvas(this.top, this.left, this.width, this.height) // блик
      };
      this.context = {
        lens: this.canvas.lens.getContext('2d'),
        dark: this.canvas.dark.getContext('2d'),
        glare: this.canvas.glare.getContext('2d')
      };
      this.lightParams = { // параметры тени
        length: lengthVector$$1, // длинна
        offset: lengthVector$$1, // смещение
        alfa: atan2(dy, dx) // угол наклона
      };
      setTimeout(function () {
        return (0, _html2canvas2.default)(_this3.src, {
          onrendered: function onrendered(canvas) {
            _this3.layout = {
              lens: _this3.context.lens.getImageData(0, 0, _this3.width, _this3.height),
              dark: _this3.context.lens.getImageData(0, 0, _this3.width, _this3.height),
              glare: _this3.context.lens.getImageData(0, 0, _this3.width, _this3.height)
            };
            _this3.image.src = canvas.toDataURL();
            _this3.image.onload = _this3.loadImage;
          }
        });
      }, 1);
    }
  }]);

  return Dlob;
}();

exports.default = Dlob;
