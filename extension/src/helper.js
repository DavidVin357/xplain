export const getIsYoutubeVideo = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const isYoutubeVideo = await chrome.tabs.sendMessage(tab.id, {
    action: 'getIsYoutubeVideo',
  })
  return isYoutubeVideo
}

export const getVideoId = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const videoId = await chrome.tabs.sendMessage(tab.id, {
    action: 'getVideoId',
  })
  return videoId
}

export const formatTimeStamp = (seconds) => {
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  const pad = (num) => String(num).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`
  } else {
    return `${minutes}:${pad(remainingSeconds)}`
  }
}

export const goToTimestamp = async (timestamp) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  await chrome.tabs.sendMessage(tab.id, {
    action: 'goToTimestamp',
    timestamp,
  })
}
