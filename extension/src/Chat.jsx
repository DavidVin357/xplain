/*global chrome*/

import { Box, TextInput, Loader, Tooltip, Tabs } from '@mantine/core'
import { SendHorizonalIcon, EraserIcon, MailSearchIcon } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useForm } from '@mantine/form'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { getVideoId } from './helper'

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
      .filter((m) => m && (m.role == 'user' || m.role == 'assistant'))
      .map((m) => {
        return {
          role: m.role,
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
        role: 'user',
        text: question,
      },
    ])

    const video_id = await getVideoId()

    chatForm.reset()

    const url = `${process.env.API_URL}/question`
    setConnected(true)
    await fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        video_id,
        question,
        chat_history,
      }),

      onmessage: (event) => {
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                role: 'assistant',
                text: (lastMessage.text += event.data),
              },
            ]
          } else {
            return [...prev, { role: 'assistant', text: event.data }]
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
        height: 'calc(100vh - 180px)',
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
                      message.role === 'user'
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
          <MailSearchIcon size='100px' color='#03045e' opacity={0.7} />
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
