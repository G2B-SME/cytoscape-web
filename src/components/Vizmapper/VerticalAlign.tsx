import { VerticalAlignType } from '../../models/VisualStyleModel/VisualPropertyValue'
import { Box } from '@mui/material'

export function VerticalAlignPicker(props: {
  currentValue: VerticalAlignType
  onClick: (verticalAlign: VerticalAlignType) => void
}): React.ReactElement {
  const { onClick, currentValue } = props

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}
    >
      {Object.values(VerticalAlignType).map(
        (verticalAlign: VerticalAlignType) => (
          <Box
            sx={{
              color: currentValue === verticalAlign ? 'blue' : 'black',
              width: 100,
              p: 1,
              '&:hover': { cursor: 'pointer' },
            }}
            onClick={() => onClick(verticalAlign)}
            key={verticalAlign}
          >
            {verticalAlign}
          </Box>
        ),
      )}
    </Box>
  )
}

export function VerticalAlign(props: {
  verticalAlign: VerticalAlignType
}): React.ReactElement {
  return <Box>{props.verticalAlign}</Box>
}
