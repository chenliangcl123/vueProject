<template>
  <div class="help">
    <h1>帮助中心</h1>
    <p>这里是帮助中心页面，可以获取使用帮助和支持。</p>
    <div class="back-btn" @click="goBack">返回首页</div>
  </div>
</template>

<script>
export default {
  name: 'HelpView',
  methods: {
    goBack() {
      window.location.href = '/';
    }
  }
}
</script>

<style scoped>
.help {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

p {
  color: #7f8c8d;
  margin-bottom: 30px;
  line-height: 1.6;
}

.back-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background-color: #5a6fd6;
}
</style>
