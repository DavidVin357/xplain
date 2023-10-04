const getVideoId = () => new URL(window.location.href).searchParams.get('v')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoTimestamp') {
    const player = document.querySelector('video')
    const timestamp = player ? player.currentTime : 0
    sendResponse(timestamp)
  }

  if (request.action === 'getVideoId') {
    const videoId = getVideoId()
    sendResponse(videoId)
  }

  if (request.action === 'getIsYoutubeVideo') {
    const videoId = getVideoId()
    sendResponse(videoId && window.location.hostname === 'www.youtube.com')
  }

  if (request.action === 'retrieveMessages') {
    const videoId = getVideoId()

    chrome.storage.sync.get([videoId]).then((result) => {
      sendResponse(result[videoId])
    })

    // Important for sending response after asynchronous call
    return true
  }

  if (request.action === 'storeMessages') {
    const videoId = getVideoId()

    chrome.storage.sync.set({ [videoId]: request.messages })
  }
})
