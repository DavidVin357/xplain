import { Box, Anchor, Text } from '@mantine/core'
import { formatTimeStamp, goToTimestamp } from './helper'

const Search = ({ searchResults }) => {
  return (
    <Box p='md'>
      <Text size='lg' fw={700}>
        Top matches
      </Text>
      {searchResults.map((result) => (
        <Text>
          <Anchor
            underline='never'
            onClick={() => goToTimestamp(result.timestamp)}>
            {formatTimeStamp(result.timestamp)}
          </Anchor>
          {` - "${result.text}"`}
        </Text>
      ))}
    </Box>
  )
}

export default Search
