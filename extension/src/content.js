const getVideoId = () => new URL(window.location.href).searchParams.get('v')

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getVideoTimestamp') {
    const player = document.querySelector('video')
    const timestamp = player ? player.currentTime : 0
    sendResponse(timestamp)
  }

  if (request.action === 'goToTimestamp') {
    const player = document.querySelector('video')
    if (player) {
      player.currentTime = request.timestamp
      player.play()
    }
  }

  if (request.action === 'getVideoId') {
    const videoId = getVideoId()
    sendResponse(videoId)
  }

  if (request.action === 'getIsYoutubeVideo') {
    const videoId = getVideoId()
    sendResponse(videoId && window.location.hostname === 'www.youtube.com')
  }

  if (request.action === 'storeMessages') {
    const videoId = getVideoId()

    chrome.storage.sync.set({ [videoId]: request.messages })
  }

  if (request.action === 'retrieveMessages') {
    const videoId = getVideoId()

    chrome.storage.sync.get([videoId]).then((result) => {
      sendResponse(result[videoId])
    })

    // Important for sending response after asynchronous call
    return true
  }

  if (request.action === 'storeSearchData') {
    const id = getVideoId() + '-search'

    chrome.storage.sync.set({ [id]: request.data })
  }

  if (request.action === 'getSearchData') {
    const id = getVideoId() + '-search'

    chrome.storage.sync.get([id]).then((result) => {
      sendResponse(result[id])
    })

    // Important for sending response after asynchronous call
    return true
  }
})
