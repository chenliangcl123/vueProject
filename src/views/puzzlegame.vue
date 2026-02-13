<template>
  <div class="puzzle-container">
    <div class="header">
      <h1>快乐拼图</h1>
      <div class="controls">
        <div class="difficulty-selector">
          <label>难度:</label>
          <select v-model="difficulty" @change="resetGame">
            <option value="3">简单 (3x3)</option>
            <option value="5">中等 (5x5)</option>
            <option value="9">较难 (9x9)</option>
            <option value="10">困难 (10x10)</option>
          </select>
        </div>
        <button @click="resetGame" class="reset-btn">重新开始</button>
        <button @click="nextLevel" class="next-level-btn">下一关</button>
      </div>
    </div>

    <!-- 倒计时提示隐藏，但功能保留 -->

    <div
      class="puzzle-board"
      :style="{ 
        width: boardSize + 'px', 
        height: boardSize + 'px',
        '--difficulty': difficulty
      }"
    >
      <!-- 倒计时期间显示完整图片 -->
      <div v-if="showPreview" class="preview-image" :style="{ backgroundImage: `url(${imageSrc})` }"></div>
      
      <!-- 倒计时结束后显示分割的拼图块 -->
      <template v-else>
        <div
          v-for="(tile, index) in tiles"
          :key="index"
          class="tile"
          :class="{
            dragging: draggedTile === tile,
            'drag-over': isDragOver(tile),
            'no-border': isWin,
            'no-pointer-events': isWin
          }"
          :style="getTileStyle(tile)"
          :draggable="!isWin"
          :data-index="index"
          @dragstart="handleDragStart(tile, $event)"
          @dragover.prevent="handleDragOver(tile)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(tile)"
          @touchstart="!isWin ? handleTouchStart(tile, $event) : null"
          @touchmove="!isWin ? handleTouchMove(tile, $event) : null"
          @touchend="!isWin ? handleTouchEnd($event) : null"
        >
        </div>
      </template>
    </div>

    <div class="win-modal" v-if="isWin">
      <div class="modal-content">
        <h2>🎉 恭喜你完成了拼图!</h2>
        <button @click="resetGame" class="play-again-btn">再玩一次</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PuzzleGame',
  data() {
    return {
      difficulty: 3,
      tiles: [],
      isWin: false,
      imageSrc: '',
      defaultImage: 'https://picsum.photos/600/600',
      boardSize: 400,
      tileSize: 0,
      showPreview: true,
      countdown: 3,
      countdownInterval: null,
      winCountdown: 3,
      winCountdownInterval: null,
      draggedTile: null,
      dragOverTile: null,
      touchedTile: null,
      touchStartX: 0,
      touchStartY: 0,
      lastTargetTile: null
    }
  },
  mounted() {
    this.imageSrc = this.defaultImage
    this.adjustBoardSize()
    window.addEventListener('resize', this.adjustBoardSize)
    this.resetGame()
  },
  beforeUnmount() {
    this.stopCountdown()
    this.stopWinCountdown()
    window.removeEventListener('resize', this.adjustBoardSize)
  },
  methods: {
    adjustBoardSize() {
      console.log('1 adjustBoardSize')
      // 根据屏幕宽度调整拼图板大小
      const screenWidth = window.innerWidth
      if (screenWidth <= 768) {
        // 手机端，使用屏幕宽度的90%
        this.boardSize = Math.min(screenWidth * 0.9, 400)
      } else {
        // 桌面端，使用固定大小
        this.boardSize = 400
      }
      // 重新计算拼图块大小
      this.tileSize = this.boardSize / this.difficulty
    },
    resetGame() {
      console.log('2 resetGame')
      this.stopCountdown()
      this.stopWinCountdown()
      this.isWin = false
      this.showPreview = true
      this.countdown = 3

      this.draggedTile = null
      this.dragOverTile = null
      this.lastTargetTile = null

      this.adjustBoardSize()
      this.tiles = this.createTiles()

      this.startCountdown()
    },

    startCountdown() {
      console.log('3 startCountdown')
      this.countdownInterval = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.stopCountdown()
          this.showPreview = false
          this.shuffleTiles()
        }
      }, 1000)
    },

    stopCountdown() {
      console.log('4 stopCountdown')
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
      }
    },

    createTiles() {
      console.log('5 createTiles')
      const tiles = []
      for (let row = 0; row < this.difficulty; row++) {
        for (let col = 0; col < this.difficulty; col++) {
          tiles.push({
            number: row * this.difficulty + col + 1,
            currentRow: row,
            currentCol: col,
            originalRow: row,
            originalCol: col,
            isEmpty: false
          })
        }
      }
      return tiles
    },

    shuffleTiles() {
      console.log('6 shuffleTiles')
      const totalTiles = this.tiles.length
      const swapCount = totalTiles * 5

      for (let i = 0; i < swapCount; i++) {
        const index1 = Math.floor(Math.random() * totalTiles)
        const index2 = Math.floor(Math.random() * totalTiles)
        this.swapTiles(this.tiles[index1], this.tiles[index2])
      }
    },

    handleDragStart(tile, event) {
      console.log('7 handleDragStart')
      if (this.isWin || this.showPreview) {
        event.preventDefault()
        return
      }
      this.draggedTile = tile
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', '')
    },

    handleDragOver(tile) {
      console.log('8 handleDragOver')
      if (this.draggedTile && this.draggedTile !== tile) {
        this.dragOverTile = tile
      }
    },

    handleDragLeave() {
      console.log('9 handleDragLeave')
      this.dragOverTile = null
    },

    isDragOver(tile) {
      console.log('10 isDragOver')
      return this.dragOverTile === tile
    },

    handleDrop(tile) {
      console.log('11 handleDrop')
      if (!this.draggedTile || this.draggedTile === tile) {
        this.dragOverTile = null
        return
      }

      // 保存被拖动的拼图块引用
      const movedTile = this.draggedTile
      const targetTile = tile

      this.swapTiles(movedTile, targetTile)
      this.draggedTile = null
      this.dragOverTile = null

      if (this.checkWin()) {
        this.handleWin()
      }
    },

    handleTouchStart(tile, event) {
      console.log('12 handleTouchStart')
      if (this.isWin || this.showPreview) {
        return
      }
      this.touchedTile = tile
      this.touchStartX = event.touches[0].clientX
      this.touchStartY = event.touches[0].clientY

      // 添加拖拽样式
      const element = event.target
      if (element && element.classList.contains('tile')) {
        element.classList.add('dragging')
      }
    },

    handleTouchMove(tile, event) {
      console.log('13 handleTouchMove')
      if (!this.touchedTile) {
        return
      }
      event.preventDefault()

      // 获取当前触摸位置
      const touch = event.touches[0]
      
      // 获取被拖拽的拼图块元素
      const draggedElement = document.querySelector(`.tile[data-index="${this.tiles.indexOf(this.touchedTile)}"]`)

      if (draggedElement) {
        // 计算移动距离
        const deltaX = touch.clientX - this.touchStartX
        const deltaY = touch.clientY - this.touchStartY

        // 应用移动（不放大）
        draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`
      }

      // 查找被触摸的拼图块
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      
      if (element && element.classList.contains('tile')) {
        // 获取该拼图块的索引
        const tileIndex = parseInt(element.getAttribute('data-index'))

        // 找到对应的拼图块对象
        const targetTile = this.tiles[tileIndex]

        if (targetTile && targetTile !== this.touchedTile) {
          // 清除之前的拖拽目标样式
          this.tiles.forEach(t => {
            const el = document.querySelector(`.tile[data-index="${this.tiles.indexOf(t)}"]`)
            if (el) el.classList.remove('drag-over')
          })

          // 添加拖拽目标样式
          element.classList.add('drag-over')
          
          // 记录最后的有效目标拼图块
          this.lastTargetTile = targetTile
        }
      }
    },

    handleTouchEnd(event) {
      console.log('14 handleTouchEnd')
      console.log(this.touchedTile)
      if (!this.touchedTile) {
        return
      }
      
      // 获取触摸结束位置
      const touch = event.changedTouches[0]
      
      // 获取被拖拽的拼图块元素
      const draggedElement = document.querySelector(`.tile[data-index="${this.tiles.indexOf(this.touchedTile)}"]`)
      
      // 临时隐藏被拖拽的元素，以便获取下方的元素
      if (draggedElement) {
        draggedElement.style.visibility = 'hidden'
      }
      
      // 获取触摸位置的元素
      const element = document.elementFromPoint(touch.clientX, touch.clientY)
      
      // 恢复被拖拽元素的可见性
      if (draggedElement) {
        draggedElement.style.visibility = ''
      }

      // 查找被触摸的拼图块
      let targetTile = null
      if (element && element.classList.contains('tile')) {
        const tileIndex = parseInt(element.getAttribute('data-index'))
        targetTile = this.tiles[tileIndex]
      }
      
      // 如果没有获取到目标拼图块，使用记录的最后有效目标拼图块
      if (!targetTile) {
        targetTile = this.lastTargetTile
      }

      // 交换拼图块
      if (targetTile && targetTile !== this.touchedTile) {
        this.swapTiles(this.touchedTile, targetTile)

        if (this.checkWin()) {
          this.handleWin()
        }
      }

      // 清除所有样式
      this.tiles.forEach(t => {
        const el = document.querySelector(`.tile[data-index="${this.tiles.indexOf(t)}"]`)
        if (el) {
          el.classList.remove('dragging')
          el.classList.remove('drag-over')
          el.style.transform = ''
        }
      })

      // 清除记录的最后有效目标拼图块
      this.lastTargetTile = null

      // 使用nextTick确保DOM更新后再清除touchedTile
      this.$nextTick(() => {
        this.touchedTile = null
      })
    },

    // 获取指定位置上的拼图块
    getTileAtPosition(row, col) {
      console.log('15 getTileAtPosition')
      return this.tiles.find(t => t.currentRow === row && t.currentCol === col)
    },

    swapTiles(tile1, tile2) {
      console.log('16 swapTiles')
      const tempRow = tile1.currentRow
      const tempCol = tile1.currentCol

      tile1.currentRow = tile2.currentRow
      tile1.currentCol = tile2.currentCol

      tile2.currentRow = tempRow
      tile2.currentCol = tempCol
    },

    checkWin() {
      console.log('17 checkWin')
      return this.tiles.every(tile =>
        tile.currentRow === tile.originalRow &&
        tile.currentCol === tile.originalCol
      )
    },

    handleWin() {
      console.log('18 handleWin')
      this.isWin = true
    },

    getTileStyle(tile) {
      console.log('19 getTileStyle')
      return {
        width: this.tileSize + 'px',
        height: this.tileSize + 'px',
        left: tile.currentCol * this.tileSize + 'px',
        top: tile.currentRow * this.tileSize + 'px',
        backgroundImage: `url(${this.imageSrc})`,
        backgroundSize: `${this.boardSize}px ${this.boardSize}px`,
        backgroundPosition: `-${tile.originalCol * this.tileSize}px -${tile.originalRow * this.tileSize}px`
      }
    },

    nextLevel() {
      console.log('20 nextLevel')
      // 生成新的随机图片URL
      const randomSeed = Math.random().toString(36).substring(7)
      this.imageSrc = `https://picsum.photos/600/600?random=${randomSeed}`
      this.resetGame()
    },

    startWinCountdown() {
      console.log('21 startWinCountdown')
      this.winCountdownInterval = setInterval(() => {
        this.winCountdown--
        if (this.winCountdown <= 0) {
          this.stopWinCountdown()
          this.isWin = false
        }
      }, 1000)
    },

    stopWinCountdown() {
      console.log('22 stopWinCountdown')
      if (this.winCountdownInterval) {
        clearInterval(this.winCountdownInterval)
        this.winCountdownInterval = null
      }
    },

    closeModal() {
      console.log('23 closeModal')
      this.isWin = false
    }
  }
}
</script>

<style scoped>
.puzzle-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.puzzle-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://picsum.photos/1920/1080?random=background');
  background-size: cover;
  background-position: center;
  filter: blur(10px);
  z-index: -1;
}

.puzzle-container::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  z-index: -1;
}

.header {
  text-align: center;
  margin-bottom: 20px;
  color: #5a6c7d;
  width: 100%;
  max-width: 600px;
}

.header h1 {
  margin: 0 0 20px 0;
  font-size: 2.8em;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.8);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2em;
  }
}

.controls {
  display: flex;
  gap: 15px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 600px;
}

@media (max-width: 768px) {
  .controls {
    gap: 10px;
  }
}

.difficulty-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.difficulty-selector label {
  font-size: 16px;
  font-weight: 500;
  color: #5a6c7d;
}

.difficulty-selector select {
  padding: 12px 25px;
  border-radius: 30px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  color: #5a6c7d;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.difficulty-selector select:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(168, 237, 234, 0.6);
}

.difficulty-selector select:focus {
  outline: none;
  box-shadow: 0 4px 15px rgba(168, 237, 234, 0.5);
  border-color: rgba(168, 237, 234, 0.8);
}

.reset-btn,
.next-level-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.reset-btn:hover,
.next-level-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.reset-btn:active,
.next-level-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.game-status {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 18px 40px;
  border-radius: 30px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  font-size: 1.1em;
  color: #5a6c7d;
  font-weight: 600;
  text-align: center;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.8);
  letter-spacing: 0.5px;
}

.puzzle-board {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-width: 100%;
  backdrop-filter: blur(15px);
  border: 3px solid rgba(255, 255, 255, 0.9);
  --difficulty: 5;
}

@media (max-width: 768px) {
  .puzzle-board {
    max-width: 90vw;
  }
}

.tile {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  user-select: none;
  border-radius: 4px;
  overflow: hidden;
  width: calc(100% / var(--difficulty));
  height: calc(100% / var(--difficulty));
}

.tile:active {
  cursor: grabbing;
}

.tile:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(168, 237, 234, 0.4);
  z-index: 10;
}

.tile.dragging {
  opacity: 0.9;
  transform: scale(1.05);
  box-shadow: 0 12px 24px rgba(168, 237, 234, 0.5);
  z-index: 100;
}

.tile.drag-over {
  transform: scale(0.95);
  box-shadow: 0 0 20px rgba(168, 237, 234, 0.6);
  border-color: #a8edea;
}

.tile.no-border {
  border: none;
  box-shadow: none;
  border-radius: 0;
}

.tile.no-pointer-events {
  pointer-events: none;
  cursor: default;
}

.preview-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  border-radius: 22px;
}

.win-modal {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.98);
  padding: 40px 60px;
  border-radius: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  border: 3px solid rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .win-modal {
    bottom: 20px;
    padding: 20px 30px;
    max-width: 90%;
  }
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.modal-content {
  text-align: center;
}

.modal-content h2 {
  margin: 0 0 25px 0;
  font-size: 1.8em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .modal-content h2 {
    font-size: 1.2em;
    margin-bottom: 15px;
  }
}

.play-again-btn {
  padding: 14px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

@media (max-width: 768px) {
  .play-again-btn {
    padding: 10px 25px;
    font-size: 14px;
  }
}

.play-again-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.play-again-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
</style>
