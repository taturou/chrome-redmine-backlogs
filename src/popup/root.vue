<template lang="pug">
    div
      el-row
        el-col(span="24")
          el-button(size="small" type="primary" @click="update") Update
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
      update () {
        console.log('update: clicked')
        chrome.tabs.query({active: true}, (tab) => {
          chrome.tabs.sendMessage(tab[0].id, {request: 'update'}, (response) => {
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
