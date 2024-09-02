import { Tabs, Box, TextInput, CloseButton, Loader } from '@mantine/core'
import {
  FileSearchIcon,
  MessageCircleDashedIcon,
  SearchIcon,
} from 'lucide-react'
import Chat from './Chat'
import Search from './Search'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useForm } from '@mantine/form'
import { getVideoId, goToTimestamp } from './helper'

const storeSearchData = async (data) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  chrome.tabs.sendMessage(tab.id, {
    action: 'storeSearchData',
    data,
  })
}

const getSearchData = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const data = await chrome.tabs.sendMessage(tab.id, {
    action: 'getSearchData',
  })

  return data
}
const Main = () => {
  const [isSearching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [activeTab, setActiveTab] = useState('chat')
  const [videoId, setVideoId] = useState(null)

  useEffect(async () => {
    const videoId = await getVideoId()
    setVideoId(videoId)

    const embeddingsUrl = `${process.env.API_URL}/embeddings`
    axios.get(embeddingsUrl, {
      params: {
        video_id: videoId,
      },
    })
  }, [])

  const form = useForm({
    initialValues: {
      query: '',
    },
  })

  useEffect(() => {
    if (activeTab === 'search' && form) {
      getSearchData().then((searchData) => {
        form.setFieldValue('query', searchData?.query || '')
        setSearchResults(searchData?.results || [])
      })
    }

    if (activeTab === 'chat' && form) {
      setSearchResults([])
      form.reset()
    }
  }, [activeTab])

  const searchTimestamp = async (videoId, query) => {
    const url = `${process.env.API_URL}/search`

    setSearching(true)
    const {
      data: { results },
    } = await axios.get(url, {
      params: {
        video_id: videoId,
        query,
      },
    })
    if (results.length) {
      goToTimestamp(results[0].timestamp)
    }

    setSearchResults(results)
    await storeSearchData({ query, results })
    console.log('saved')
    setActiveTab('search')
    setSearching(false)
  }

  return (
    videoId && (
      <Box>
        <Tabs defaultValue='chat' value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value='chat' leftSection={<MessageCircleDashedIcon />}>
              Chat
            </Tabs.Tab>
            <Tabs.Tab value='search' leftSection={<FileSearchIcon />}>
              Video search
            </Tabs.Tab>
          </Tabs.List>

          <>
            <form
              onSubmit={form.onSubmit((values) => {
                searchTimestamp(videoId, values.query)
              })}>
              <TextInput
                placeholder='Search for a phrase in video...'
                leftSection={<SearchIcon size='40%' />}
                rightSection={
                  !isSearching ? (
                    <CloseButton
                      variant='transparent'
                      onClick={() => {
                        form.setFieldValue('query', '')
                        setSearchResults([])
                        storeSearchData(null)
                      }}
                    />
                  ) : (
                    <Loader size='xs' />
                  )
                }
                {...form.getInputProps('query')}
              />
            </form>

            <Tabs.Panel value='chat'>
              <Chat />
            </Tabs.Panel>

            <Tabs.Panel value='search'>
              <Search searchResults={searchResults} videoId={videoId} />
            </Tabs.Panel>
          </>
        </Tabs>
      </Box>
    )
  )
}

export default Main
