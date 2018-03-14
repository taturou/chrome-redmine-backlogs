console.log('background!')

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.greeting === 'bg-listener') {
      console.log('bg-listener: called')
      sendResponse({msg: 'bg-listener: called'})
    }
  }
)
