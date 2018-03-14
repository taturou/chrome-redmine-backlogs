<template lang="pug">
    div
      //el-row
      //  el-col(span="24")
      //    el-button(size="small" type="primary" @click="tab") New tab
      //el-row
      //  el-col(span="24")
      //   el-button(size="small" type="primary" @click="background") background
      el-row
        el-col(span="24")
          el-button(size="small" type="primary" @click="content") Update
</template>
<script>
  export default {
    data: () => ({
    }),
    computed: { },
    created () {
      console.log('New tab')
    },
    mounted () { },
    methods: {
      tab () {
        chrome.tabs.create({ url: 'pages/app.html' })
      },
      background () {
        console.log('background: clicked')
        chrome.runtime.sendMessage({greeting: 'bg-listener'}, (response) => {
          console.log(response.msg)
        })
      },
      content () {
        console.log('content: clicked')
        chrome.tabs.query({active: true}, (tab) => {
          let tab0 = tab[0]
          chrome.tabs.sendMessage(tab0.id, {text: ''}, (response) => {
            console.log(response.msg)
          })
        })
      }
    }
  }
</script>
<style lang="scss">
  div {
    color: blue
  }
  .el-row {
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .el-button {
    margin: auto;
  }
</style>
