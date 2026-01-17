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
        <div class="puzzle-board" :style="{ width: boardWidth + 'px', height: boardHeight + 'px' }">
          <!-- 拼图块 -->
          <div
            v-for="(piece, index) in puzzlePieces"
            :key="piece.id"
            class="puzzle-piece"
            :class="{ 'correct': piece.isCorrect, 'dragging': piece.isDragging }"
            :style="{
              width: pieceWidth + 'px',
              height: pieceHeight + 'px',
              backgroundImage: 'url(' + imageUrl + ')',
              backgroundPosition: piece.backgroundPosition,
              backgroundSize: boardWidth + 'px ' + boardHeight + 'px',
              left: piece.currentX + 'px',
              top: piece.currentY + 'px',
              opacity: piece.isDragging ? 0.9 : 1,
              zIndex: getPieceZIndex(piece),
              transition: piece.isDragging ? 'none' : 'all 0.3s ease'
            }"
            @mousedown="startDrag($event, index)"
            @touchstart="startDrag($event, index)"
            @dragstart="handleDragStart()"
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

    <div class="success-message" v-if="showSuccessMessage">
      <div class="message-content">
        <h2>🎉 恭喜您完成了拼图！</h2>
        <button class="btn" @click="resetGame">再玩一次</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PuzzleGameFixedView',
  data() {
    return {
      imageUrl: '',
      imageLoaded: false,
      difficulty: 3,
      boardWidth: 450,
      boardHeight: 450,
      puzzlePieces: [],
      pieceWidth: 150,
      pieceHeight: 150,
      isDragging: false,
      draggedPieceIndex: null,
      draggedPieces: [],
      dragStartX: 0,
      dragStartY: 0,
      pieceStartX: 0,
      pieceStartY: 0,
      isComplete: false,
      placeholder: null,
      showSuccessMessage: false,
      successTimer: null,
      tolerance: 5 // 容差常量
    }
  },
  computed: {
    // 计算拼图板的总块数
    totalPieces() {
      return this.difficulty * this.difficulty
    }
  },
  beforeUnmount() {
    // 组件销毁前清理定时器
    if (this.successTimer) {
      clearTimeout(this.successTimer)
    }
  },
  methods: {
    // 计算拼图块的z-index，确保被拖动的拼图块组不会出现白块
    getPieceZIndex(piece) {
      if (!piece.isDragging) {
        return 1
      }

      // 如果是被拖动的拼图块，根据其在draggedPieces数组中的位置设置z-index
      const dragIndex = this.draggedPieces.findIndex(p => p.id === piece.id)
      if (dragIndex !== -1) {
        // 使用基础z-index加上拖动索引，确保所有被拖动的拼图块都有不同的z-index
        return 100 + dragIndex
      }

      return 1
    },

    handleImageUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          this.calculateBoardDimensions(img)
          this.imageUrl = e.target.result
          this.imageLoaded = true
          this.initGame()
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    },

    // 计算拼图板尺寸
    calculateBoardDimensions(img) {
      const MAX_WIDTH = 500
      const MAX_HEIGHT = 500
      const MIN_SIZE = 300

      const aspectRatio = img.width / img.height

      // 根据宽高比计算尺寸
      if (aspectRatio > 1) {
        this.boardWidth = MAX_WIDTH
        this.boardHeight = MAX_WIDTH / aspectRatio
      } else {
        this.boardHeight = MAX_HEIGHT
        this.boardWidth = MAX_HEIGHT * aspectRatio
      }

      // 确保拼图板大小不会太小
      if (this.boardWidth < MIN_SIZE) {
        this.boardWidth = MIN_SIZE
        this.boardHeight = MIN_SIZE / aspectRatio
      }
      if (this.boardHeight < MIN_SIZE) {
        this.boardHeight = MIN_SIZE
        this.boardWidth = MIN_SIZE * aspectRatio
      }
    },

    initGame() {
      this.isComplete = false
      this.pieceWidth = this.boardWidth / this.difficulty
      this.pieceHeight = this.boardHeight / this.difficulty
      this.puzzlePieces = this.createPuzzlePieces()
      this.shufflePieces()
    },

    // 创建拼图块
    createPuzzlePieces() {
      const pieces = []
      for (let row = 0; row < this.difficulty; row++) {
        for (let col = 0; col < this.difficulty; col++) {
          const correctX = col * this.pieceWidth
          const correctY = row * this.pieceHeight

          pieces.push({
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
      return pieces
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

      // 获取被拖动的拼图块
      const piece = this.puzzlePieces[index]

      // 找出所有与当前拼图块相连且相对位置正确的拼图块
      this.draggedPieces = this.findConnectedPieces(piece)

      // 标记所有被拖动的拼图块
      this.draggedPieces.forEach(p => {
        p.isDragging = true
        p.dragStartX = p.currentX
        p.dragStartY = p.currentY
      })

      const clientX = event.clientX || event.touches[0].clientX
      const clientY = event.clientY || event.touches[0].clientY

      this.dragStartX = clientX
      this.dragStartY = clientY
      this.pieceStartX = piece.currentX
      this.pieceStartY = piece.currentY

      // 创建占位符
      this.placeholder = {
        pieces: this.draggedPieces.map(p => ({
          x: p.currentX,
          y: p.currentY,
          width: this.pieceWidth,
          height: this.pieceHeight,
          backgroundPosition: p.backgroundPosition
        }))
      }

      // 添加全局事件监听
      document.addEventListener('mousemove', this.handleDrag)
      document.addEventListener('mouseup', this.stopDrag)
      document.addEventListener('touchmove', this.handleDrag)
      document.addEventListener('touchend', this.stopDrag)
    },

    handleDrag(event) {
      if (!this.isDragging || this.draggedPieces.length === 0) return

      event.preventDefault()

      const clientX = event.clientX || event.touches[0].clientX
      const clientY = event.clientY || event.touches[0].clientY

      const deltaX = clientX - this.dragStartX
      const deltaY = clientY - this.dragStartY

      // 计算整个拼图块组的边界
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      this.draggedPieces.forEach(piece => {
        const newX = piece.dragStartX + deltaX
        const newY = piece.dragStartY + deltaY
        minX = Math.min(minX, newX)
        minY = Math.min(minY, newY)
        maxX = Math.max(maxX, newX)
        maxY = Math.max(maxY, newY)
      })

      // 计算需要调整的偏移量，确保整个拼图块组都在拼图板内
      let adjustedDeltaX = deltaX
      let adjustedDeltaY = deltaY
      if (minX < 0) adjustedDeltaX -= minX
      if (minY < 0) adjustedDeltaY -= minY
      if (maxX > this.boardWidth - this.pieceWidth) adjustedDeltaX -= (maxX - (this.boardWidth - this.pieceWidth))
      if (maxY > this.boardHeight - this.pieceHeight) adjustedDeltaY -= (maxY - (this.boardHeight - this.pieceHeight))

      // 移动所有被拖动的拼图块
      this.draggedPieces.forEach(piece => {
        const newX = piece.dragStartX + adjustedDeltaX
        const newY = piece.dragStartY + adjustedDeltaY
        piece.currentX = newX
        piece.currentY = newY
      })

      // 更新拼图块状态
      this.draggedPieces.forEach(piece => {
        piece.isCorrect = piece.currentX === piece.correctX && piece.currentY === piece.correctY
      })
    },

    stopDrag() {
      if (!this.isDragging || this.draggedPieces.length === 0) return

      // 计算所有被拖动拼图块的目标位置
      const targetPositions = this.draggedPieces.map(piece => {
        const nearestX = Math.round(piece.currentX / this.pieceWidth) * this.pieceWidth
        const nearestY = Math.round(piece.currentY / this.pieceHeight) * this.pieceHeight
        return {
          piece: piece,
          targetX: nearestX,
          targetY: nearestY
        }
      })

      // 收集所有被拖动拼图块的起始位置
      const draggedStartPositions = new Map()
      this.draggedPieces.forEach(piece => {
        draggedStartPositions.set(`${piece.dragStartX},${piece.dragStartY}`, piece)
      })

      // 计算拼图块组的整体移动方向和距离
      let totalDeltaX = 0, totalDeltaY = 0
      this.draggedPieces.forEach(piece => {
        const deltaX = piece.currentX - piece.dragStartX
        const deltaY = piece.currentY - piece.dragStartY
        totalDeltaX += deltaX
        totalDeltaY += deltaY
      })
      const avgDeltaX = totalDeltaX / this.draggedPieces.length
      const avgDeltaY = totalDeltaY / this.draggedPieces.length

      // 确定主要移动方向
      const isHorizontalMove = Math.abs(avgDeltaX) > Math.abs(avgDeltaY)
      const moveDirection = isHorizontalMove ? (avgDeltaX > 0 ? 1 : -1) : (avgDeltaY > 0 ? 1 : -1)

      // 计算拼图块组的边界
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      this.draggedPieces.forEach(piece => {
        minX = Math.min(minX, piece.dragStartX)
        maxX = Math.max(maxX, piece.dragStartX)
        minY = Math.min(minY, piece.dragStartY)
        maxY = Math.max(maxY, piece.dragStartY)
      })
      const groupWidth = maxX - minX + this.pieceWidth
      const groupHeight = maxY - minY + this.pieceHeight

      // 找出所有需要移动的非拖动拼图块
      const moves = []
      targetPositions.forEach(({ targetX, targetY }) => {
        // 检查目标位置是否有非拖动拼图块
        const pieceAtPosition = this.puzzlePieces.find(p =>
          !p.isDragging &&
          Math.abs(p.currentX - targetX) < 1 &&
          Math.abs(p.currentY - targetY) < 1
        )

        if (pieceAtPosition) {
          // 检查这个位置是否是被拖动拼图块的起始位置
          const startPiece = draggedStartPositions.get(`${targetX},${targetY}`)

          if (!startPiece) {
            // 计算移动距离
            let moveX = 0, moveY = 0

            // 如果是水平移动，移动距离为整个拼图块组的宽度
            if (isHorizontalMove) {
              moveX = moveDirection * groupWidth
            } else {
              // 如果是垂直移动，移动距离为整个拼图块组的高度
              moveY = moveDirection * groupHeight
            }

            // 检查是否已经记录了这个拼图块的移动
            const existingMove = moves.find(m => m.piece.id === pieceAtPosition.id)
            if (!existingMove) {
              moves.push({
                piece: pieceAtPosition,
                moveX: moveX,
                moveY: moveY
              })
            }
          }
        }
      })

      // 执行所有移动操作
      moves.forEach(move => {
        const { piece, moveX, moveY } = move

        // 将非拖动拼图块向反方向移动整个拼图块组的长度
        piece.currentX = piece.currentX + moveX
        piece.currentY = piece.currentY + moveY
        piece.isCorrect = piece.currentX === piece.correctX && 
                          piece.currentY === piece.correctY
      })

      // 移动所有被拖动的拼图块到目标位置
      targetPositions.forEach(({ piece, targetX, targetY }) => {
        piece.currentX = targetX
        piece.currentY = targetY
        piece.isCorrect = piece.currentX === piece.correctX && piece.currentY === piece.correctY
      })

      // 重置拖动状态
      this.draggedPieces.forEach(piece => {
        piece.isDragging = false
      })
      this.isDragging = false
      this.draggedPieceIndex = null
      this.draggedPieces = []

      // 清除占位符
      this.placeholder = null

      // 移除全局事件监听
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.stopDrag)
      document.removeEventListener('touchmove', this.handleDrag)
      document.removeEventListener('touchend', this.stopDrag)

      // 检查是否完成
      this.checkCompletion()
    },

    handleDragStart(e) {
      e.preventDefault()
    },

    // 检查拼图块是否有相邻的拼图块，且它们的相对位置和方向都是正确的
    hasCorrectNeighbor(piece) {
      // 检查四个方向的邻居
      const neighbors = [
        { dx: 0, dy: -1 }, // 上
        { dx: 1, dy: 0 },  // 右
        { dx: 0, dy: 1 },  // 下
        { dx: -1, dy: 0 }  // 左
      ]

      for (const { dx, dy } of neighbors) {
        // 计算邻居的当前位置
        const neighborCurrentX = piece.currentX + dx * this.pieceWidth
        const neighborCurrentY = piece.currentY + dy * this.pieceHeight

        // 找到在当前位置的拼图块
        const neighborPiece = this.puzzlePieces.find(p =>
          Math.abs(p.currentX - neighborCurrentX) < this.tolerance &&
          Math.abs(p.currentY - neighborCurrentY) < this.tolerance &&
          p.id !== piece.id
        )

        // 如果找到相邻的拼图块，检查它们的相对位置和方向是否正确
        if (neighborPiece) {
          // 计算邻居拼图块相对于当前拼图块的正确位置
          const correctRelativeX = neighborPiece.correctX - piece.correctX
          const correctRelativeY = neighborPiece.correctY - piece.correctY

          // 计算邻居拼图块相对于当前拼图块的实际位置
          const actualRelativeX = neighborPiece.currentX - piece.currentX
          const actualRelativeY = neighborPiece.currentY - piece.currentY

          // 检查相对位置和方向是否正确
          const isXCorrect = Math.abs(correctRelativeX - actualRelativeX) < this.tolerance
          const isYCorrect = Math.abs(correctRelativeY - actualRelativeY) < this.tolerance

          // 检查方向是否正确（例如，如果邻居应该在上方，则实际位置也必须在上方）
          const isDirectionCorrect =
            (correctRelativeX === 0 && actualRelativeX === 0) ||
            (correctRelativeY === 0 && actualRelativeY === 0)

          // 如果相对位置和方向都正确，返回true
          if (isXCorrect && isYCorrect && isDirectionCorrect) {
            return true
          }
        }
      }

      // 没有找到相对位置和方向都正确的相邻拼图块，返回false
      return false
    },

    // 找出所有与指定拼图块相连且相对位置正确的拼图块
    findConnectedPieces(piece) {
      const connectedPieces = [piece]
      const checkedPieces = new Set([piece.id])

      const checkNeighbors = (currentPiece) => {
        // 检查四个方向的邻居
        const neighbors = [
          { dx: 0, dy: -1 }, // 上
          { dx: 1, dy: 0 },  // 右
          { dx: 0, dy: 1 },  // 下
          { dx: -1, dy: 0 }  // 左
        ]

        neighbors.forEach(({ dx, dy }) => {
          // 计算邻居的当前位置
          const neighborCurrentX = currentPiece.currentX + dx * this.pieceWidth
          const neighborCurrentY = currentPiece.currentY + dy * this.pieceHeight

          // 找到在当前位置的拼图块
          const neighborPiece = this.puzzlePieces.find(p =>
            Math.abs(p.currentX - neighborCurrentX) < this.tolerance &&
            Math.abs(p.currentY - neighborCurrentY) < this.tolerance &&
            !checkedPieces.has(p.id)
          )

          if (neighborPiece) {
            // 计算邻居拼图块相对于当前拼图块的正确位置
            const correctRelativeX = neighborPiece.correctX - currentPiece.correctX
            const correctRelativeY = neighborPiece.correctY - currentPiece.correctY

            // 计算邻居拼图块相对于当前拼图块的实际位置
            const actualRelativeX = neighborPiece.currentX - currentPiece.currentX
            const actualRelativeY = neighborPiece.currentY - currentPiece.currentY

            // 检查相对位置和方向是否正确
            const isXCorrect = Math.abs(correctRelativeX - actualRelativeX) < this.tolerance
            const isYCorrect = Math.abs(correctRelativeY - actualRelativeY) < this.tolerance

            // 只有当相对位置正确时，才将其添加到连接的拼图块列表中
            if (isXCorrect && isYCorrect) {
              checkedPieces.add(neighborPiece.id)
              connectedPieces.push(neighborPiece)
              checkNeighbors(neighborPiece)
            }
          }
        })
      }

      checkNeighbors(piece)

      return connectedPieces
    },

    checkCompletion() {
      this.isComplete = this.puzzlePieces.every(piece => piece.isCorrect)

      if (this.isComplete) {
        // 显示成功消息
        this.showSuccessMessage = true

        // 3秒后自动隐藏成功消息
        if (this.successTimer) {
          clearTimeout(this.successTimer)
        }
        this.successTimer = setTimeout(() => {
          this.showSuccessMessage = false
        }, 3000)
      }
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
  transition: box-shadow 0.2s, opacity 0.2s;
}

.puzzle-piece.dragging {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.puzzle-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.puzzle-placeholder > div {
  position: absolute;
  border: 2px dashed rgba(102, 126, 234, 0.5);
  background-color: rgba(102, 126, 234, 0.1);
  box-sizing: border-box;
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
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.success-message .message-content {
  background-color: transparent;
  padding: 0;
  box-shadow: none;
  text-align: center;
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
  margin: 0 0 15px 0;
  font-size: 18px;
}

@media (max-width: 768px) {
  .puzzle-game {
    padding: 10px;
  }

  .header h1 {
    font-size: 24px;
  }

  .controls {
    gap: 10px;
  }

  .btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .difficulty-select {
    padding: 8px;
    font-size: 12px;
  }

  .game-container {
    flex-direction: column;
  }

  .puzzle-area {
    width: 100%;
  }

  .puzzle-board {
    max-width: 100%;
  }

  .preview-area {
    width: 100%;
    margin-top: 20px;
  }

  .success-message {
    top: 10px;
    left: 50%;
    right: 10px;
    transform: translateX(-50%);
    width: calc(100% - 20px);
    padding: 15px 20px;
  }

  .message-content h2 {
    font-size: 16px;
  }
}
</style>
