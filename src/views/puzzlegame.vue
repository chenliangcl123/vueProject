<template>
  <div class="puzzle-game">
    <div class="header">
      <h1>拼图游戏</h1>
      <div class="controls">
        <label for="image-upload" class="btn upload-btn">
          <span>选择图片</span>
          <input type="file" id="image-upload" @change="handleImageUpload" accept="image/*" style="display: none">
        </label>
        <select v-model="difficulty" class="difficulty-select" @change="resetGame">
          <option value="3">简单 (3x3)</option>
          <option value="4">中等 (4x4)</option>
          <option value="5">困难 (5x5)</option>
        </select>
        <button class="btn reset-btn" @click="resetGame">重新开始</button>
        <button class="btn back-btn" @click="goBack">返回首页</button>
      </div>
    </div>

    <div class="game-container">
      <div class="puzzle-area" v-if="imageLoaded">
        <div class="puzzle-board" :style="{ width: boardSize + 'px', height: boardSize + 'px' }">
          <div 
            v-for="(piece, index) in puzzlePieces" 
            :key="index"
            class="puzzle-piece"
            :class="{ 'correct': piece.isCorrect }"
            :style="{
              width: pieceSize + 'px',
              height: pieceSize + 'px',
              backgroundImage: 'url(' + imageUrl + ')',
              backgroundPosition: piece.backgroundPosition,
              backgroundSize: boardSize + 'px ' + boardSize + 'px',
              left: piece.currentX + 'px',
              top: piece.currentY + 'px',
              opacity: piece.isDragging ? 0.8 : 1,
              zIndex: piece.isDragging ? 100 : 1
            }"
            @mousedown="startDrag($event, index)"
            @touchstart="startDrag($event, index)"
            @dragstart="handleDragStart"
            draggable="false"
          ></div>
        </div>
      </div>

      <div class="preview-area" v-if="imageLoaded">
        <h3>原图预览</h3>
        <img :src="imageUrl" alt="原图" class="preview-image">
      </div>

      <div class="no-image" v-if="!imageLoaded">
        <p>请选择一张图片开始游戏</p>
      </div>
    </div>

    <div class="success-message" v-if="isComplete">
      <div class="message-content">
        <h2>🎉 恭喜您完成了拼图！</h2>
        <button class="btn" @click="resetGame">再玩一次</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PuzzleGameView',
  data() {
    return {
      imageUrl: '',
      imageLoaded: false,
      difficulty: 3,
      boardSize: 450,
      puzzlePieces: [],
      pieceSize: 150,
      isDragging: false,
      draggedPieceIndex: null,
      dragStartX: 0,
      dragStartY: 0,
      pieceStartX: 0,
      pieceStartY: 0,
      isComplete: false
    }
  },
  methods: {
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // 计算图片的显示尺寸，保持宽高比
          const maxWidth = 500
          const maxHeight = 500
          
          const aspectRatio = img.width / img.height
          
          if (aspectRatio > 1) {
            this.boardSize = Math.min(maxWidth, img.width)
          } else {
            this.boardSize = Math.min(maxHeight, img.height)
          }
          
          // 确保拼图板大小不会太小
          if (this.boardSize < 300) {
            this.boardSize = 300
          }
          
          this.imageUrl = e.target.result
          this.imageLoaded = true
          this.initGame()
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    },

    initGame() {
      this.isComplete = false
      this.pieceSize = this.boardSize / this.difficulty
      this.puzzlePieces = []

      // 创建拼图块
      for (let row = 0; row < this.difficulty; row++) {
        for (let col = 0; col < this.difficulty; col++) {
          const correctX = col * this.pieceSize
          const correctY = row * this.pieceSize

          this.puzzlePieces.push({
            id: row * this.difficulty + col,
            correctX,
            correctY,
            currentX: correctX,
            currentY: correctY,
            backgroundPosition: `-${correctX}px -${correctY}px`,
            isDragging: false,
            isCorrect: true
          })
        }
      }

      // 打乱拼图块位置
      this.shufflePieces()
    },

    shufflePieces() {
      // 收集所有位置
      const positions = this.puzzlePieces.map(piece => ({
        x: piece.currentX,
        y: piece.currentY
      }))

      // 随机打乱位置
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[positions[i], positions[j]] = [positions[j], positions[i]]
      }

      // 将打乱后的位置分配给拼图块
      this.puzzlePieces.forEach((piece, index) => {
        piece.currentX = positions[index].x
        piece.currentY = positions[index].y
        piece.isCorrect = piece.currentX === piece.correctX && piece.currentY === piece.correctY
      })

      // 检查是否已经完成（虽然概率很低）
      this.checkCompletion()
    },

    startDrag(event, index) {
      event.preventDefault()
      this.isDragging = true
      this.draggedPieceIndex = index

      const clientX = event.clientX || event.touches[0].clientX
      const clientY = event.clientY || event.touches[0].clientY

      this.dragStartX = clientX
      this.dragStartY = clientY
      this.pieceStartX = this.puzzlePieces[index].currentX
      this.pieceStartY = this.puzzlePieces[index].currentY

      this.puzzlePieces[index].isDragging = true

      // 添加全局事件监听
      document.addEventListener('mousemove', this.handleDrag)
      document.addEventListener('mouseup', this.stopDrag)
      document.addEventListener('touchmove', this.handleDrag)
      document.addEventListener('touchend', this.stopDrag)
    },

    handleDrag(event) {
      if (!this.isDragging || this.draggedPieceIndex === null) return

      event.preventDefault()

      const clientX = event.clientX || event.touches[0].clientX
      const clientY = event.clientY || event.touches[0].clientY

      const deltaX = clientX - this.dragStartX
      const deltaY = clientY - this.dragStartY

      // 限制拖动范围在拼图板内
      const newX = Math.max(0, Math.min(this.boardSize - this.pieceSize, this.pieceStartX + deltaX))
      const newY = Math.max(0, Math.min(this.boardSize - this.pieceSize, this.pieceStartY + deltaY))

      this.puzzlePieces[this.draggedPieceIndex].currentX = newX
      this.puzzlePieces[this.draggedPieceIndex].currentY = newY
    },

    stopDrag() {
      if (!this.isDragging || this.draggedPieceIndex === null) return

      const piece = this.puzzlePieces[this.draggedPieceIndex]

      // 计算最近的网格位置
      const nearestX = Math.round(piece.currentX / this.pieceSize) * this.pieceSize
      const nearestY = Math.round(piece.currentY / this.pieceSize) * this.pieceSize

      // 检查该位置是否已有其他拼图块
      const pieceAtPosition = this.puzzlePieces.find((p, index) => 
        index !== this.draggedPieceIndex && 
        Math.abs(p.currentX - nearestX) < 1 && 
        Math.abs(p.currentY - nearestY) < 1
      )

      if (pieceAtPosition) {
        // 如果该位置已有拼图块，则交换位置
        const tempX = pieceAtPosition.currentX
        const tempY = pieceAtPosition.currentY

        pieceAtPosition.currentX = piece.currentX
        pieceAtPosition.currentY = piece.currentY

        piece.currentX = tempX
        piece.currentY = tempY
      } else {
        // 如果该位置为空，则移动到该位置
        piece.currentX = nearestX
        piece.currentY = nearestY
      }

      // 更新是否正确
      piece.isCorrect = piece.currentX === piece.correctX && piece.currentY === piece.correctY
      if (pieceAtPosition) {
        pieceAtPosition.isCorrect = pieceAtPosition.currentX === pieceAtPosition.correctX && pieceAtPosition.currentY === pieceAtPosition.correctY
      }

      // 重置拖动状态
      piece.isDragging = false
      this.isDragging = false
      this.draggedPieceIndex = null

      // 移除全局事件监听
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.stopDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.stopDrag)

      // 检查是否完成
      this.checkCompletion()
    },

    handleDragStart(event) {
      event.preventDefault()
    },

    checkCompletion() {
      this.isComplete = this.puzzlePieces.every(piece => piece.isCorrect)
    },

    resetGame() {
      if (this.imageLoaded) {
        this.initGame()
      }
    },

    goBack() {
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
.puzzle-game {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.btn:hover {
  background-color: #5a6fd6;
}

.upload-btn {
  display: inline-block;
  background-color: #42b983;
}

.upload-btn:hover {
  background-color: #3aa876;
}

.reset-btn {
  background-color: #f39c12;
}

.reset-btn:hover {
  background-color: #e67e22;
}

.back-btn {
  background-color: #95a5a6;
}

.back-btn:hover {
  background-color: #7f8c8d;
}

.difficulty-select {
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 14px;
}

.game-container {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.puzzle-area {
  flex: 1;
  display: flex;
  justify-content: center;
}

.puzzle-board {
  position: relative;
  background-color: #f5f7fa;
  border: 2px solid #ddd;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.puzzle-piece {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.5);
  cursor: move;
  box-sizing: border-box;
  transition: box-shadow 0.2s;
}

.puzzle-piece:hover {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.puzzle-piece.correct {
  border: 1px solid rgba(66, 185, 131, 0.5);
}

.preview-area {
  width: 250px;
  text-align: center;
}

.preview-area h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.preview-image {
  max-width: 100%;
  border: 2px solid #ddd;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.no-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 450px;
  background-color: #f5f7fa;
  border-radius: 8px;
  color: #7f8c8d;
  font-size: 18px;
}

.success-message {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.message-content {
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.message-content h2 {
  color: #42b983;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .board-size {
    width: 300px;
    height: 300px;
  }

  .preview-area {
    width: 100%;
  }
}
</style>
