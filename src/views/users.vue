<template>
  <div class="users">
    <h1>用户管理</h1>
    <p>这里是用户管理页面，可以管理系统用户和权限。</p>
    <div class="back-btn" @click="goBack">返回首页</div>
  </div>
</template>

<script>
export default {
  name: 'UsersView',
  methods: {
    goBack() {
      window.location.href = '/';
    }
  }
}
</script>

<style scoped>
.users {
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
