import { EdgeLineType } from '../../models/VisualStyleModel/VisualPropertyValue'
import { Box } from '@mui/material'
import {
  DottedLineIcon,
  SolidLineIcon,
  DashedLineIcon,
} from './VisualPropertyValueIcons'
const edgeLineMap: Record<EdgeLineType, React.ReactElement> = {
  solid: <SolidLineIcon />,
  dotted: <DottedLineIcon />,
  dashed: <DashedLineIcon />,
}
export function EdgeLinePicker(props: {
  currentValue: EdgeLineType
  onValueChange: (edgeLine: EdgeLineType) => void
}): React.ReactElement {
  const { onValueChange, currentValue } = props

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}
    >
      {Object.values(EdgeLineType).map((edgeLine: EdgeLineType) => (
        <Box
          sx={{
            color: currentValue === edgeLine ? 'blue' : 'black',
            width: 100,
            p: 1,
            '&:hover': { cursor: 'pointer' },
          }}
          onClick={() => onValueChange(edgeLine)}
          key={edgeLine}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignContent: 'center',
              width: 100,
            }}
          >
            <Box>{edgeLine}</Box>
            <EdgeLine value={edgeLine} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export function EdgeLine(props: { value: EdgeLineType }): React.ReactElement {
  return edgeLineMap[props.value] ?? <Box>{props.value}</Box>
}
