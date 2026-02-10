<template>
  <div class="puzzle-container">
    <div class="header">
      <h1>快乐拼图</h1>
      <div class="controls">
        <div class="difficulty-selector">
          <label>难度:</label>
          <select v-model="difficulty" @change="resetGame">
            <option value="5">简单 (5x5)</option>
            <option value="9">中等 (9x9)</option>
            <option value="10">困难 (10x10)</option>
          </select>
        </div>
        <button @click="resetGame" class="reset-btn">重新开始</button>
        <button @click="nextLevel" class="next-level-btn">下一关</button>
      </div>
    </div>

    <div class="game-status" v-if="showPreview">
      <p>请记住原图位置，{{ countdown }}秒后开始游戏...</p>
    </div>

    <div
      class="puzzle-board"
      :style="{ width: boardSize + 'px', height: boardSize + 'px' }"
    >
      <div
        v-for="(tile, index) in tiles"
        :key="index"
        class="tile"
        :class="{
          dragging: draggedTile === tile,
          'drag-over': isDragOver(tile),
          'no-border': isWin
        }"
        :style="getTileStyle(tile)"
        :draggable="!isWin"
        @dragstart="handleDragStart(tile, $event)"
        @dragover.prevent="handleDragOver(tile)"
        @dragleave="handleDragLeave"
        @drop="handleDrop(tile)"
        @touchstart="handleTouchStart(tile, $event)"
        @touchmove="handleTouchMove(tile, $event)"
        @touchend="handleTouchEnd($event)"
      >
      </div>
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
      difficulty: 5,
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
      touchStartY: 0
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
      this.stopCountdown()
      this.stopWinCountdown()
      this.isWin = false
      this.showPreview = true
      this.countdown = 3

      this.draggedTile = null
      this.dragOverTile = null

      this.adjustBoardSize()
      this.tiles = this.createTiles()

      this.startCountdown()
    },

    startCountdown() {
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
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval)
        this.countdownInterval = null
      }
    },

    createTiles() {
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
      const totalTiles = this.tiles.length
      const swapCount = totalTiles * 5

      for (let i = 0; i < swapCount; i++) {
        const index1 = Math.floor(Math.random() * totalTiles)
        const index2 = Math.floor(Math.random() * totalTiles)
        this.swapTiles(this.tiles[index1], this.tiles[index2])
      }
    },

    handleDragStart(tile, event) {
      if (this.isWin || this.showPreview) {
        event.preventDefault()
        return
      }
      this.draggedTile = tile
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', '')
    },

    handleDragOver(tile) {
      if (this.draggedTile && this.draggedTile !== tile) {
        this.dragOverTile = tile
      }
    },

    handleDragLeave() {
      this.dragOverTile = null
    },

    isDragOver(tile) {
      return this.dragOverTile === tile
    },

    handleDrop(tile) {
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
      if (this.isWin || this.showPreview) {
        return
      }
      this.touchedTile = tile
      this.touchStartX = event.touches[0].clientX
      this.touchStartY = event.touches[0].clientY
    },

    handleTouchMove(tile, event) {
      event.preventDefault()
    },

    handleTouchEnd(event) {
      if (!this.touchedTile) {
        return
      }

      const touchEndX = event.changedTouches[0].clientX
      const touchEndY = event.changedTouches[0].clientY

      const deltaX = touchEndX - this.touchStartX
      const deltaY = touchEndY - this.touchStartY

      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // 判断滑动方向
      if (absDeltaX > absDeltaY) {
        // 水平滑动
        if (absDeltaX > 30) {
          const targetCol = deltaX > 0 
            ? this.touchedTile.currentCol + 1 
            : this.touchedTile.currentCol - 1
          const targetRow = this.touchedTile.currentRow

          // 检查目标位置是否在边界内
          if (targetCol >= 0 && targetCol < this.difficulty) {
            const targetTile = this.getTileAtPosition(targetRow, targetCol)
            if (targetTile) {
              this.swapTiles(this.touchedTile, targetTile)
              if (this.checkWin()) {
                this.handleWin()
              }
            }
          }
        }
      } else {
        // 垂直滑动
        if (absDeltaY > 30) {
          const targetRow = deltaY > 0 
            ? this.touchedTile.currentRow + 1 
            : this.touchedTile.currentRow - 1
          const targetCol = this.touchedTile.currentCol

          // 检查目标位置是否在边界内
          if (targetRow >= 0 && targetRow < this.difficulty) {
            const targetTile = this.getTileAtPosition(targetRow, targetCol)
            if (targetTile) {
              this.swapTiles(this.touchedTile, targetTile)
              if (this.checkWin()) {
                this.handleWin()
              }
            }
          }
        }
      }

      this.touchedTile = null
    },

    // 获取指定位置上的拼图块
    getTileAtPosition(row, col) {
      return this.tiles.find(t => t.currentRow === row && t.currentCol === col)
    },

    swapTiles(tile1, tile2) {
      const tempRow = tile1.currentRow
      const tempCol = tile1.currentCol

      tile1.currentRow = tile2.currentRow
      tile1.currentCol = tile2.currentCol

      tile2.currentRow = tempRow
      tile2.currentCol = tempCol
    },

    checkWin() {
      return this.tiles.every(tile =>
        tile.currentRow === tile.originalRow &&
        tile.currentCol === tile.originalCol
      )
    },

    handleWin() {
      this.isWin = true
      this.winCountdown = 3
      this.startWinCountdown()
    },

    getTileStyle(tile) {
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
      // 生成新的随机图片URL
      const randomSeed = Math.random().toString(36).substring(7)
      this.imageSrc = `https://picsum.photos/600/600?random=${randomSeed}`
      this.resetGame()
    },

    startWinCountdown() {
      this.winCountdownInterval = setInterval(() => {
        this.winCountdown--
        if (this.winCountdown <= 0) {
          this.stopWinCountdown()
          this.isWin = false
        }
      }, 1000)
    },

    stopWinCountdown() {
      if (this.winCountdownInterval) {
        clearInterval(this.winCountdownInterval)
        this.winCountdownInterval = null
      }
    },

    closeModal() {
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
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  background-attachment: fixed;
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
  font-size: 2.5em;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.8em;
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

.difficulty-selector select {
  padding: 10px 20px;
  border-radius: 25px;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.9);
  color: #5a6c7d;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.difficulty-selector select:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
}

.difficulty-selector select:focus {
  outline: none;
  box-shadow: 0 4px 10px rgba(168, 237, 234, 0.4);
}

.reset-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #5a6c7d;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(255, 154, 158, 0.3);
  transition: all 0.3s ease;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 154, 158, 0.4);
}

.next-level-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #5a6c7d;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(168, 237, 234, 0.3);
  transition: all 0.3s ease;
}

.next-level-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(168, 237, 234, 0.4);
}

.game-status {
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px 30px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-size: 1.2em;
  color: #5a6c7d;
  font-weight: 500;
  text-align: center;
  backdrop-filter: blur(10px);
}

.puzzle-board {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: visible;
  max-width: 100%;
  backdrop-filter: blur(10px);
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

.win-modal {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 30px 50px;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(168, 237, 234, 0.3);
  z-index: 1000;
  animation: slideUp 0.3s ease;
  backdrop-filter: blur(10px);
}

@keyframes slideUp {
  from {
    transform: translateX(-50%) translateY(20px);
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
  margin: 0 0 20px 0;
  color: #5a6c7d;
  font-weight: 600;
}

.play-again-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #5a6c7d;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(168, 237, 234, 0.3);
}

.play-again-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(168, 237, 234, 0.4);
}
</style>
