import { checkLineToLine, containStroke, isInsideCircle } from "./draw-utils";

export default class GJLDraw {
  constructor(canvasEl, { arrowArr = [], areaArr = [] }) {
    this.canvasEl = canvasEl;
    this.context = this.canvasEl.getContext("2d");
    // 样式
    this.strokeStyle = "#FF5A59";
    this.lineActiveStyle = "#0037ff";
    this.fillStyle = "rgba(255, 90, 89, 0.3)";
    this.areaActiveStyle = "rgba(0, 55, 255, 0.5)";
    this.lineWidth = 2;
    // 箭头 hover 或 点击 时的区域控制
    this.lineWidthRound = 10;
    this.areaVertexRadius = 10;

    // 初始化的箭头
    this.arrowArr = arrowArr;
    this.areaArr = areaArr;
    this.drawExistedArrow();
    this.drawExistedArea();

    // 拖拽的原点
    this.dragOriginPoint = { x: 0, y: 0 };
    this.tempCopyArea = [];
    this.targetVertex = null;

    // 当前在画的箭头
    this.currentArrow = [];

    // 当前在画的区域
    this.currentArea = [];

    // active 箭头的index;
    this.activeArrowIndex = -1;
  }

  // 设置当前高亮的箭头的 index
  setActiveArrowIndex(loc) {
    if (this.arrowArr.length) {
      let isOnArrow = false;
      this.arrowArr.forEach((arrow, index) => {
        if (
          containStroke(
            arrow.start.x,
            arrow.start.y,
            arrow.end.x,
            arrow.end.y,
            this.lineWidth + this.lineWidthRound,
            loc.x,
            loc.y
          )
        ) {
          this.activeArrowIndex = index;
          this.activeAreaIndex = -1;
          isOnArrow = true;
        }
        // console.log('this.activeArrowIndex: ', this.activeArrowIndex);
      });
      if (!isOnArrow) {
        this.activeArrowIndex = -1;
      }
    }
  }

  // 设置当前高亮的区域的 index
  setActiveAreaIndex(loc) {
    if (this.areaArr.length) {
      let isOnArea = false;
      this.areaArr.forEach((area, index) => {
        area = area.area;
        const firstVertex = area[0];
        this.context.beginPath();
        this.context.moveTo(firstVertex.x, firstVertex.y);
        area.slice(1).forEach((area) => {
          this.context.lineTo(area.x, area.y);
        });
        this.context.lineTo(firstVertex.x, firstVertex.y);
        this.context.closePath();

        if (this.context.isPointInPath(loc.x, loc.y)) {
          isOnArea = true;
          this.activeAreaIndex = index;
          this.activeArrowIndex = -1;
        } else {
          area.forEach((center) => {
            if (
              isInsideCircle(
                center.x,
                center.y,
                this.areaVertexRadius,
                loc.x,
                loc.y
              )
            ) {
              isOnArea = true;
              this.activeAreaIndex = index;
              this.activeArrowIndex = -1;
            }
          });
        }
        // console.log('this.activeAreaIndex: ', this.activeAreaIndex);
      });
      if (!isOnArea) {
        this.activeAreaIndex = -1;
      }
    }
  }

  reset() {
    this.clearCanvas();
    this.arrowArr = [];
    this.areaArr = [];
    this.currentArea = [];
    this.currentArrow = [];
    this.activeArrowIndex = -1;
    this.activeAreaIndex = -1;
  }

  // 翻转划线箭头
  reverseActiveArrow() {
    if (this.activeArrowIndex !== -1) {
      const target = this.arrowArr[this.activeArrowIndex];
      const reverseTarget = {
        start: target.end,
        end: target.start,
        config: target.config,
      };
      this.arrowArr.splice(this.activeArrowIndex, 1, reverseTarget);
      this.clearCanvas();
      this.drawExistedArrow();
    }
  }

  // 删除选中的箭头
  deleteActiveArrow() {
    if (this.activeArrowIndex !== -1) {
      this.arrowArr.splice(this.activeArrowIndex, 1);
      this.activeArrowIndex = -1;
      this.clearCanvas();
      this.drawExistedArrow();
      this.drawExistedArea();
    }
  }

  // 删除选中的区域
  deleteActiveArea() {
    if (this.activeAreaIndex !== -1) {
      this.areaArr.splice(this.activeAreaIndex, 1);
      this.activeAreaIndex = -1;
      this.clearCanvas();
      this.drawExistedArrow();
      this.drawExistedArea();
    }
  }

  // 清空画布
  clearCanvas() {
    this.context.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
  }

  // 绘制已经存在的箭头
  drawExistedArrow(loc) {
    if (this.arrowArr.length) {
      this.arrowArr.forEach((item, index) => {
        this.drawVerticalArrow(item.start, item.end);
        let isHover = false;
        if (loc) {
          isHover = containStroke(
            item.start.x,
            item.start.y,
            item.end.x,
            item.end.y,
            this.lineWidth + this.lineWidthRound,
            loc.x,
            loc.y
          );
        }
        const isActive = this.activeArrowIndex === index;
        this.drawArrow(item.start, item.end, isActive || isHover);
      });
    }
  }

  // 绘制当前的箭头
  drawingArrow(from, to) {
    this.clearCanvas();
    this.drawExistedArrow();
    this.drawExistedArea();
    this.currentArrow = [from, to];
    this.drawVerticalArrow(from, to);
    this.drawArrow(from, to);
  }

  // 保存箭头
  saveCurArrow() {
    if (!this.currentArrow.length) return false;
    this.arrowArr.push({
      start: this.currentArrow[0],
      end: this.currentArrow[1],
      config: { name: "名称", type: "类型" },
    });
    this.currentArrow = [];
    return true;
  }

  // 画线头
  drawArrow({ x: fromX, y: fromY }, { x: toX, y: toY }, active) {
    const headlen = 10; // 自定义箭头线的长度
    const theta = 45; // 自定义箭头线与直线的夹角，个人觉得45°刚刚好
    let arrowX, arrowY; // 箭头线终点坐标
    // 计算各角度和对应的箭头终点坐标
    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI;
    const angle1 = ((angle + theta) * Math.PI) / 180;
    const angle2 = ((angle - theta) * Math.PI) / 180;
    const topX = headlen * Math.cos(angle1);
    const topY = headlen * Math.sin(angle1);
    const botX = headlen * Math.cos(angle2);
    const botY = headlen * Math.sin(angle2);

    this.context.beginPath();
    // 画直线
    this.context.moveTo(fromX, fromY);
    this.context.lineTo(toX, toY);

    arrowX = toX + topX;
    arrowY = toY + topY;
    // 画上边箭头线
    this.context.moveTo(arrowX, arrowY);
    this.context.lineTo(toX, toY);

    arrowX = toX + botX;
    arrowY = toY + botY;
    // 画下边箭头线
    this.context.lineTo(arrowX, arrowY);

    this.context.strokeStyle = active ? this.lineActiveStyle : this.strokeStyle;
    // console.log('this.context: ', this.context);
    this.context.lineWidth = this.lineWidth;
    this.context.stroke();
  }

  // 画垂直箭头
  drawVerticalArrow({ x: fromX, y: fromY }, { x: toX, y: toY }) {
    // 中点坐标
    const mid = {
      x: (fromX + toX) / 2,
      y: (fromY + toY) / 2,
    };
    // 垂直线上的点坐标
    const angle = (Math.atan2(fromY - toY, fromX - toX) * 180) / Math.PI; // 当前直线的角度
    const verticalAngle = ((angle + 90) * Math.PI) / 180; // 垂直线的角度
    const len = 25;
    const verticalTarget = {
      x: mid.x + len * Math.cos(verticalAngle),
      y: mid.y + len * Math.sin(verticalAngle),
    };
    this.context.setLineDash([2, 1]);
    this.drawArrow(mid, verticalTarget);
    this.context.setLineDash([]);
    this.context.closePath();
  }

  // 画区域ing
  drawingArea(lastPoint) {
    this.clearCanvas();
    this.drawExistedArrow();
    this.drawExistedArea();
    // this.currentArea.push()
    this.drawArea([...this.currentArea, lastPoint]);
  }

  // 画区域
  drawArea(vertexArr, mouseLoc, isActive = false) {
    // 画边和区域
    const firstVertex = vertexArr[0];
    this.context.beginPath();
    this.context.moveTo(firstVertex.x, firstVertex.y);
    vertexArr.slice(1).forEach((area) => {
      this.context.lineTo(area.x, area.y);
    });
    this.context.lineTo(firstVertex.x, firstVertex.y);
    this.context.lineWidth = this.lineWidth;
    this.context.strokeStyle = this.strokeStyle;
    this.context.stroke();

    this.context.closePath();

    // 判断鼠标是否在当前区域
    let isHover = false;
    if (mouseLoc) {
      if (this.context.isPointInPath(mouseLoc.x, mouseLoc.y)) {
        isHover = true;
      } else {
        vertexArr.forEach((center) => {
          if (
            isInsideCircle(
              center.x,
              center.y,
              this.areaVertexRadius,
              mouseLoc.x,
              mouseLoc.y
            )
          ) {
            isHover = true;
          }
        });
      }
    }

    this.context.fillStyle =
      isHover || isActive ? this.areaActiveStyle : this.fillStyle;
    this.context.fill();
    // 画顶点
    vertexArr.forEach((center) => {
      this.context.beginPath();
      this.context.arc(
        center.x,
        center.y,
        this.areaVertexRadius,
        0,
        2 * Math.PI
      );
      this.context.lineTo(center.x, center.y);
      this.context.fillStyle =
        isHover || isActive ? this.lineActiveStyle : this.strokeStyle;
      this.context.fill();
    });
  }

  // 设置拖拽的原点
  setDragOriginPoint(loc) {
    this.dragOriginPoint = loc;
  }

  // 清楚暂存的区域
  clearTempCopyArea() {
    this.tempCopyArea = [];
  }

  setTargetVertex(loc) {
    if (this.activeAreaIndex !== -1) {
      const targetArea = this.areaArr[this.activeAreaIndex];

      targetArea &&
        targetArea.area.forEach((center) => {
          if (
            isInsideCircle(
              center.x,
              center.y,
              this.areaVertexRadius,
              loc.x,
              loc.y
            )
          ) {
            this.targetVertex = center;
          }
        });
    }
  }

  // 拖动区域
  dragingArea(loc) {
    // 拖动鼠标移动区域
    if (this.activeAreaIndex !== -1) {
      const targetArea = this.areaArr.splice(this.activeAreaIndex, 1);

      if (this.targetVertex) {
        // 移动顶点
        this.targetVertex.x = loc.x;
        this.targetVertex.y = loc.y;
      } else {
        // 移动整个区域
        if (!this.tempCopyArea.length) {
          this.tempCopyArea = targetArea[0].area.map((vertex) => {
            return { ...vertex };
          });
        }
        // 计算偏移
        const offsetX = loc.x - this.dragOriginPoint.x;
        const offsetY = loc.y - this.dragOriginPoint.y;

        targetArea[0].area.forEach((vertex, index) => {
          const originVertex = this.tempCopyArea[index];
          vertex.x = originVertex.x + offsetX;
          vertex.y = originVertex.y + offsetY;
        });
      }

      this.areaArr.push(...targetArea);
      this.activeAreaIndex = this.areaArr.length - 1;
      this.clearCanvas();
      this.drawExistedArrow();
      this.drawExistedArea(loc);
    }
  }

  // 保存当前区域
  saveCurArea() {
    if (!this.currentArea.length) return false;
    this.areaArr.push({
      area: [...this.currentArea],
      config: { name: "名称", type: "类型" },
    });
    this.currentArea = [];
    return true;
  }

  // 画已经存在的区域
  drawExistedArea(loc) {
    if (this.areaArr.length) {
      this.areaArr.forEach((item, index) => {
        this.drawArea(item.area, loc, this.activeAreaIndex === index);
      });
    }
  }

  // 检测区域是否交叉闭合
  checkArea() {
    let isPass = true;
    this.areaArr.forEach((item) => {
      console.log(
        "intersects(item.area): ",
        checkLineToLine(item.area[0], item.area)
      );
      console.log("item.area: ", item.area);
      if (!checkLineToLine(item.area[0], item.area)) {
        isPass = false;
      }
    });
    return isPass;
  }
}
