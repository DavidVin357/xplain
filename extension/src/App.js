/*global chrome*/
import '@mantine/core/styles.css'

import './App.css'

import { Flex, MantineProvider } from '@mantine/core'
import Chat from './Chat'
import { useEffect, useState } from 'react'

const getIsYoutubeVideo = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const isYoutubeVideo = await chrome.tabs.sendMessage(tab.id, {
    action: 'getIsYoutubeVideo',
  })
  return isYoutubeVideo
}

function App() {
  const [isYoutube, setIsYoutube] = useState(false)

  useEffect(async () => {
    const isYoutube = await getIsYoutubeVideo()
    setIsYoutube(isYoutube)

    // Scroll to bottom of chat
    // setTimeout(
    //   () =>
    //     window.scrollTo({
    //       top: document.body.scrollHeight,
    //       behavior: 'smooth',
    //     }),
    //   10
    // )
  }, [])
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'light',
      }}>
      <Flex>
        <a href='https://github.com/DavidVin357'>
          <img
            src='./images/logo.svg'
            alt='logo'
            style={{
              height: '30px',
            }}
          />
        </a>
      </Flex>

      {isYoutube ? <Chat /> : <h1>Not Youtube</h1>}
    </MantineProvider>
  )
}

export default App
