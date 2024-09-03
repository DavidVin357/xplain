/*global chrome*/
import '@mantine/core/styles.css'

import './App.css'

import { MantineProvider } from '@mantine/core'
import { useEffect, useState } from 'react'
import Main from './Main'
import { getIsYoutubeVideo } from './helper'

function App() {
  const [isYoutube, setIsYoutube] = useState(false)

  useEffect(async () => {
    try {
      const isYoutube = await getIsYoutubeVideo()
      setIsYoutube(isYoutube)
    } catch (e) {
      setIsYoutube(false)
    }
  }, [])

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'light',
      }}>
      <img
        src='./images/logo.svg'
        alt='logo'
        style={{
          height: '30px',
        }}
      />
      {isYoutube ? (
        <Main />
      ) : (
        <div style={{ marginLeft: '10px' }}>
          <h1>Not Youtube</h1>
          <h4>Go to Youtube video to see the extension</h4>
        </div>
      )}
    </MantineProvider>
  )
}

export default App
