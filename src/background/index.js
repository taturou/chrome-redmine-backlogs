// アラームを登録
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('update', {periodInMinutes: 1})
})

// アラームトリガで content を呼び出す
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'update') {
    console.log('update: called')
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {request: 'update'}, (response) => {
        console.log(response.msg)
      })
    })
  }
})
