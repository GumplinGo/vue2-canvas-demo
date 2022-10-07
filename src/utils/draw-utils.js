// 已知一条线段和一个点，求点到线段的垂直距离，初中学的知识
export function containStroke(x0, y0, x1, y1, lineWidth, x, y) {
  if (lineWidth === 0) {
    return false;
  }
  const _l = lineWidth;
  let _a = 0;
  let _b = x0;
  // Quick reject
  if (
    (y > y0 + _l && y > y1 + _l) ||
    (y < y0 - _l && y < y1 - _l) ||
    (x > x0 + _l && x > x1 + _l) ||
    (x < x0 - _l && x < x1 - _l)
  ) {
    return false;
  }

  if (x0 !== x1) {
    _a = (y0 - y1) / (x0 - x1);
    _b = (x0 * y1 - x1 * y0) / (x0 - x1);
  } else {
    return Math.abs(x - x0) <= _l / 2;
  }
  const tmp = _a * x - y + _b;
  const _s = (tmp * tmp) / (_a * _a + 1);
  return _s <= ((_l / 2) * _l) / 2;
}

// 在某个圆形内
export function isInsideCircle(x0, y0, r, x, y) {
  return (x - x0) * (x - x0) + (y - y0) * (y - y0) < r * r;
}

// ==============================

// true 无相交；false 有相交
export function checkLineToLine(pointArr) {
  // 线交叉 判断 ,
  // const arr = [];
  const edgeArr = [];
  const mixArr = [];
  const resultArr = [];
  for (let i = 1; i < pointArr.length; i++) {
    const arr = [];
    arr.push(pointArr[i - 1], pointArr[i]);
    edgeArr.push(arr);
  }
  for (let i = 0; i < edgeArr.length; i++) {
    for (let j = 0; j < edgeArr.length; j++) {
      if (i !== j) {
        mixArr.push([edgeArr[i], edgeArr[j]]);
      }
    }
  }
  for (let index = 0; index < mixArr.length; index++) {
    const result = segmentsIntr(
      mixArr[index][0][0],
      mixArr[index][0][1],
      mixArr[index][1][0],
      mixArr[index][1][1]
    );
    resultArr.push(result);
  }

  if (resultArr.findIndex((target) => target === true) === -1) {
    return true;
  } else {
    return false;
  }
}

function segmentsIntr(a, b, c, d) {
  // 线是否重合

  const areaAbc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
  const areaAbd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
  // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,当作不相交处理);
  if (areaAbc * areaAbd >= 0) {
    return false;
  }
  // 三角形cda 面积的2倍
  const areaCda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
  // 三角形cdb 面积的2倍
  const areaCdb = areaCda + areaAbc - areaAbd;
  if (areaCda * areaCdb >= 0) {
    return false;
  }
  // 计算交点坐标
  // const t = areaCda / (areaAbd - areaAbc);
  // const dx = t * (b.x - a.x);
  // const dy = t * (b.y - a.y);
  // { x: a.x + dx, y: a.y + dy }
  return true;
}
