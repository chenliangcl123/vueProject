<template>
  <div class="home">
    <div class="header">
      <h1>欢迎来到我们的应用</h1>
      <p class="subtitle">请选择您要访问的模块</p>
    </div>
    <div class="menu-container">
      <div class="menu-item" @click="navigateTo('dashboard')">
        <div class="menu-icon">📊</div>
        <h3>仪表盘</h3>
        <p>查看数据概览和统计信息</p>
      </div>
      <div class="menu-item" @click="navigateTo('users')">
        <div class="menu-icon">👥</div>
        <h3>用户管理</h3>
        <p>管理系统用户和权限</p>
      </div>
      <div class="menu-item" @click="navigateTo('settings')">
        <div class="menu-icon">⚙️</div>
        <h3>系统设置</h3>
        <p>配置系统参数和选项</p>
      </div>
      <div class="menu-item" @click="navigateTo('reports')">
        <div class="menu-icon">📈</div>
        <h3>报表中心</h3>
        <p>生成和查看各类报表</p>
      </div>
      <div class="menu-item" @click="navigateTo('documents')">
        <div class="menu-icon">📄</div>
        <h3>文档中心</h3>
        <p>查看和管理系统文档</p>
      </div>
      <div class="menu-item" @click="navigateTo('help')">
        <div class="menu-icon">❓</div>
        <h3>帮助中心</h3>
        <p>获取使用帮助和支持</p>
      </div>
      <div class="menu-item" @click="navigateTo('puzzlegame')">
        <div class="menu-icon">🧩</div>
        <h3>拼图游戏</h3>
        <p>挑战有趣的拼图游戏</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  methods: {
    navigateTo(page) {
      this.$router.push(`/${page}`);
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.menu-container {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  padding: 50px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.menu-item {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 30px 20px;
  width: 300px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.menu-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.menu-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.menu-item h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.3rem;
}

.menu-item p {
  color: #7f8c8d;
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>
