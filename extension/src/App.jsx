/*global chrome*/
import '@mantine/core/styles.css'

import './App.css'

import { MantineProvider } from '@mantine/core'
import { useEffect, useState } from 'react'
import Main from './Main'
import { getIsYoutubeVideo } from './helper'

function App() {
  const [isYoutube, setIsYoutube] = useState(true)

  useEffect(async () => {
    const isYoutube = await getIsYoutubeVideo()
    console.log('isYoutube', isYoutube)
    setIsYoutube(isYoutube)
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
      {isYoutube ? <Main /> : <h1>Not Youtube</h1>}
    </MantineProvider>
  )
}

export default App
