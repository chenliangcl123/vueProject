<template>
  <div class="hello">
    <input type="file" id="oneFile">
    <button v-on:click="uploadFile">上传文件</button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Upload',
  methods: {
    uploadFile: function () {
      var date = new Date()
      var fileObject = document.getElementById('oneFile').files[0]
      console.log(fileObject)
      axios.post('http://localhost:8102/v2/upload/getAuth', {
        date: date.toUTCString(),
        method: 'PUT',
        file_name: fileObject.name
      }).then(function (response) {
        console.log(response)
      }).catch(function (err) {
        console.log(err)
      })
    }
  }
}
</script>
