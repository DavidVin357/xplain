/*global chrome*/

import { Box, TextInput, Loader, Tooltip, Button } from '@mantine/core'
import { SendHorizonalIcon, EraserIcon, MailSearchIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from '@mantine/form'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const getTimeStamp = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const timestamp = await chrome.tabs.sendMessage(tab.id, {
    action: 'getVideoTimestamp',
  })
  return timestamp
}

const getVideoId = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const videoId = await chrome.tabs.sendMessage(tab.id, {
    action: 'getVideoId',
  })
  return videoId
}

const retrieveMessages = async () => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  const messages = await chrome.tabs.sendMessage(tab.id, {
    action: 'retrieveMessages',
  })
  return messages
}

const storeMessages = async (messages) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  await chrome.tabs.sendMessage(tab.id, {
    action: 'storeMessages',
    messages,
  })
}

const Chat = () => {
  const [isConnected, setConnected] = useState(false)

  const [messages, setMessages] = useState([])

  const chatFeedRef = useRef(null)

  const getChatHistory = () => {
    const chat_history = messages
      .filter((m) => m && (m.type == 'q' || m.type == 'a'))
      .map((m) => {
        return {
          role: m.type === 'q' ? 'user' : 'assistant',
          content: m.text,
        }
      })
    return chat_history
  }
  useEffect(async () => {
    const messages = await retrieveMessages()
    if (messages?.length) {
      setMessages(messages)
    }
  }, [])

  useEffect(() => {
    // When answer is completed (null at the end), store the messages
    if (messages?.length && messages[messages.length - 1] == null) {
      storeMessages(messages.slice(0, -1))
    }

    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight
    }
  }, [messages])

  const chatForm = useForm({
    initialValues: {
      question: '',
    },
  })

  const askQuestion = async (question) => {
    const chat_history = getChatHistory()

    setMessages((prev) => [
      ...prev,
      {
        type: 'q',
        text: question,
      },
    ])

    const timestamp = await getTimeStamp()
    const video_id = await getVideoId()

    chatForm.reset()

    const url = 'https://xplain.live/question'

    await fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        timestamp,
        video_id,
        question,
        chat_history,
      }),

      onopen(res) {
        if (res.ok && res.status === 200) {
          setConnected(true)
        }
      },
      onmessage: (event) => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage.type === 'a') {
            return [
              ...prev.slice(0, -1),
              {
                type: 'a',
                text: (lastMessage.text += event.data),
              },
            ]
          } else {
            return [...prev, { type: 'a', text: event.data }]
          }
        })
      },
      onclose() {
        setMessages((messages) => [...messages, null])
        setConnected(false)
      },
    })
  }

  return (
    <Box
      style={{
        width: '100vw',
        // justifyContent: 'space-between',
        height: 'calc(100vh - 90px)',
        overflowY: 'auto',
      }}
      id='chat'
      ref={chatFeedRef}>
      {messages?.length ? (
        <Box px={15}>
          {messages.map((message) => {
            return (
              message && (
                <Box
                  style={{
                    borderRadius: 20,
                    background:
                      message.type === 'q'
                        ? 'linear-gradient(35deg, #ed6ea0, #ec8c69)'
                        : '#845EF7',
                    color: 'white',
                    marginBottom: '10px',
                    marginTop: '5px',
                    padding: '10px',
                  }}>
                  {message.text}
                </Box>
              )
            )
          })}
        </Box>
      ) : (
        <Box mx='35%' my='35%'>
          <MailSearchIcon size='100px' color='#DB2777' opacity={0.4} />
        </Box>
      )}

      <form
        className='chat-form'
        onSubmit={chatForm.onSubmit((values) => {
          if (values.question) {
            askQuestion(values.question)
          }
        })}
        style={{
          width: '100%',
          position: 'fixed',
          bottom: 0,
          borderTop: '1px solid #dedfe0',
          padding: '3px',
          backgroundColor: '#ffffff',
        }}>
        <TextInput
          {...chatForm.getInputProps('question')}
          placeholder='Your question'
          variant='unstyled'
          size='lg'
          radius='xs'
          leftSection={
            <Tooltip label='Clear history'>
              <EraserIcon
                color='black'
                style={{
                  cursor: 'pointer',
                }}
                onClick={() => {
                  chatForm.reset()
                  storeMessages([])
                  setMessages([])
                }}
              />
            </Tooltip>
          }
          rightSection={
            isConnected ? (
              <Loader size='xs' />
            ) : (
              <SendHorizonalIcon
                style={{
                  cursor: 'pointer',
                }}
                color='#364FC7'
                onClick={() => {
                  const question = chatForm.values.question

                  if (question) {
                    askQuestion(question)
                  }
                }}
              />
            )
          }
        />
      </form>
    </Box>
  )
}

export default Chat
