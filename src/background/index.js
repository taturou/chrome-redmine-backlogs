console.log('background!')

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.greeting === 'bg-listener') {
      console.log('bg-listener: called')
      sendResponse({msg: 'bg-listener: called'})
    }
  }
)

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('update', {periodInMinutes: 1})
})

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
