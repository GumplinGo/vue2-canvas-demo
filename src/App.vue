<template>
  <div class="dt-container">
    <div class="canvas-wrap" ref="canvasRef">
      <canvas
        :class="[
          'canvas-el',
          { 'is-drawing': isDrawing, 'is-draging': isDraging },
        ]"
        ref="canvas"
        :width="width"
        :height="height"
        @click="handleClick"
        @dblclick="handleDblclick"
        @mousemove="handleMove"
        @mousedown="handleDown"
        @mouseup="handleUp"
      ></canvas>
      <div
        v-if="activeArrowIndex !== -1"
        class="dialog"
        :style="{ left: mousePosition.x + 'px', top: mousePosition.y + 'px' }"
      >
        <template v-if="activeArrow.config">
          <div
            class="dialog-item"
            v-for="(val, key) in activeArrow.config"
            :key="key"
          >
            {{ key }}:
            <el-input
              v-model="activeArrow.config[key]"
              placeholder=""
            ></el-input>
          </div>
        </template>
      </div>
    </div>
    <div class="btn">
      <el-button type="primary" @click="handleDrawArrow">绘制箭头</el-button>
      <el-button type="primary" @click="handleDrawArea">绘制区域</el-button>
      <el-button type="primary" @click="handleReverseArrow">翻转箭头</el-button>
      <el-button type="primary" @click="handleDeleteArrow">删除箭头</el-button>
      <el-button type="primary" @click="handleDeleteArea">删除区域</el-button>
      <el-button type="primary" @click="handleCheckArea"
        >区域是否交叉</el-button
      >
      <el-button type="primary" @click="handleClear">清空配置</el-button>
    </div>
  </div>
</template>

<script>
import GJLDraw from "@/utils/gjl-draw";
export default {
  data() {
    return {
      width: 300,
      height: 150,
      GJLDraw: null,
      // 控制点击双击事件
      clickTimeout: null,
      timeoutDelay: 200,
      arrowLoc: { from: null, to: null },
      isDrawingArrow: false,
      isDrawingArea: false,
      mousePosition: { x: 0, y: 0 },
      canDrag: false,
      isDraging: false,
    };
  },
  computed: {
    activeArrowIndex() {
      return this.GJLDraw ? this.GJLDraw.activeArrowIndex : -1;
    },
    activeArrow() {
      if (this.GJLDraw) {
        if (this.GJLDraw.activeArrowIndex === -1) {
          return { start: null, end: null, config: null };
        } else {
          return this.GJLDraw.arrowArr[this.GJLDraw.activeArrowIndex];
        }
      } else {
        return { start: null, end: null, config: null };
      }
    },
    isDrawing() {
      return this.isDrawingArrow || this.isDrawingArea;
    },
  },
  mounted() {
    this.$nextTick(() => {
      const box = this.$refs.canvasRef.getBoundingClientRect();
      this.width = box.width;
      this.height = box.height;
      this.GJLDraw = new GJLDraw(this.$refs.canvas, {});
    });
  },
  methods: {
    windowToCanvas(canvas, x, y) {
      const bbox = canvas.getBoundingClientRect();
      return {
        x: x - bbox.x,
        y: y - bbox.y,
      };
    },
    handleClick(e) {
      const loc = this.windowToCanvas(this.$refs.canvas, e.clientX, e.clientY);
      this.mousePosition = loc;
      clearTimeout(this.clickTimeout);
      if (this.isDrawingArrow) {
        this.clickTimeout = setTimeout(() => {
          this.arrowLoc.from = loc;
        }, this.timeoutDelay);
      } else if (this.isDrawingArea) {
        this.clickTimeout = setTimeout(() => {
          this.GJLDraw.currentArea.push(loc);
        }, this.timeoutDelay);
      } else {
        this.clickTimeout = setTimeout(() => {
          this.GJLDraw.setActiveArrowIndex(loc);
          this.GJLDraw.setActiveAreaIndex(loc);
          this.GJLDraw.drawExistedArrow(loc);
          this.GJLDraw.drawExistedArea(loc);
        }, this.timeoutDelay);
      }
    },
    handleDblclick(e) {
      if ((!this.isDrawingArrow || !this.arrowLoc.from) && !this.isDrawingArea)
        return;
      clearTimeout(this.clickTimeout);
      const loc = this.windowToCanvas(this.$refs.canvas, e.clientX, e.clientY);
      if (this.isDrawingArrow) {
        this.arrowLoc.to = loc;
        this.GJLDraw.drawingArrow(this.arrowLoc.from, this.arrowLoc.to);
        this.GJLDraw.saveCurArrow();
        this.arrowLoc.from = this.arrowLoc.to = null;
        this.isDrawingArrow = false;
      } else if (this.isDrawingArea) {
        this.GJLDraw.currentArea.push(loc);
        this.GJLDraw.saveCurArea();
        this.isDrawingArea = false;
      }
    },
    handleMove(e) {
      const loc = this.windowToCanvas(this.$refs.canvas, e.clientX, e.clientY);
      if (this.isDrawingArrow) {
        this.arrowLoc.to = loc;
        if (this.arrowLoc.from && this.arrowLoc.to) {
          this.GJLDraw.drawingArrow(this.arrowLoc.from, this.arrowLoc.to);
        }
      } else if (this.isDrawingArea) {
        this.GJLDraw.drawingArea(loc);
      } else if (this.canDrag) {
        this.GJLDraw.dragingArea(loc);
      } else {
        this.GJLDraw.clearCanvas();
        this.GJLDraw.drawExistedArrow(loc);
        this.GJLDraw.drawExistedArea(loc);
      }
    },
    handleDown(e) {
      this.canDrag = true;
      this.isDraging = true;
      const loc = this.windowToCanvas(this.$refs.canvas, e.clientX, e.clientY);
      // 保存一下原点
      this.GJLDraw.setDragOriginPoint(loc);
      // 设置选中
      this.GJLDraw.setActiveAreaIndex(loc);
      // 如果点击在顶点上，保存一下顶点的引用
      this.GJLDraw.setTargetVertex(loc);
    },
    // eslint-disable-next-line no-unused-vars
    handleUp(e) {
      this.canDrag = false;
      this.isDraging = false;
      this.GJLDraw.clearTempCopyArea();
      // 清空顶点的引用
      this.GJLDraw.targetVertex = null;
    },
    handleDrawArrow() {
      this.isDrawingArrow = true;
    },
    handleDrawArea() {
      this.isDrawingArea = true;
    },
    handleReverseArrow() {
      this.GJLDraw.reverseActiveArrow();
    },
    handleDeleteArrow() {
      this.GJLDraw.deleteActiveArrow();
    },
    handleDeleteArea() {
      this.GJLDraw.deleteActiveArea();
    },
    handleClear() {
      this.GJLDraw.reset();
    },
    getRandomNumer(max) {
      return parseInt(Math.random() * max);
    },
    handleCheckArea() {
      this.GJLDraw.checkArea();
    },
  },
};
</script>

<style lang="scss" scoped>
.dt-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;

  .canvas-wrap {
    width: 70%;
    height: 500px;
    border: 1px solid pink;
    position: relative;

    .canvas-el {
      &.is-drawing {
        cursor: crosshair;
      }
      &.is-draging {
        cursor: grab;
      }
    }

    .dialog {
      position: absolute;
      left: 0;
      top: 0;
      min-width: 100px;
      min-height: 100px;
      border: 1px solid pink;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.5);
      padding: 10px;

      .dialog-item {
        display: flex;
        align-items: center;
        justify-content: flex-end;

        .el-input {
          width: 100px;
          margin-left: 10px;
        }
      }

      .dialog-item + .dialog-item {
        margin-top: 10px;
      }
    }
  }

  .btn {
    margin-top: 40px;
  }
}
</style>
