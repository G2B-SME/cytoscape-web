import * as React from 'react'
import Box from '@mui/material/Box'
import Cytoscape, { Core } from 'cytoscape'
import { IdType } from '../models/IdType'
import { useVisualStyleStore } from '../store/VisualStyleStore'
import { useTableStore } from '../store/TableStore'
import { useNdexNetwork } from '../store/useNdexNetwork'

import VisualStyleFn from '../models/VisualStyleModel' // VisualPropertyValueType,
// import { cyJsVisualPropertyConverter } from '../models/VisualStyleModel/impl/cyJsVisualPropertyMap'

interface NetworkRendererProps {
  currentNetworkId: IdType
}

export default function NetworkRenderer(
  props: NetworkRendererProps,
): React.ReactElement {
  const n = useNdexNetwork(props.currentNetworkId)
  const visualStyles = useVisualStyleStore((state) => state.visualStyles)
  const tables = useTableStore((state) => state.tables)
  const vs = visualStyles[props.currentNetworkId]
  const table = tables[props.currentNetworkId]

  if (n == null || vs == null || table == null) {
    return <div>Loading Network...</div>
  }

  const [cy, setCy] = React.useState(null as any)
  const cyContainer = React.useRef(null)

  const renderCyJs = (): void => {
    const computeStyleSheets = true
    const computedRender = (): void => {
      const networkView = VisualStyleFn.createCyJsView(
        vs,
        n,
        table.nodeTable,
        table.edgeTable,
      )
      cy.add(networkView.nodeViews)
      cy.add(networkView.edgeViews)
    }

    const styleSheetRender = (): void => {
      const { defaultStyle, cyNodes, cyEdges } =
        VisualStyleFn.createCyJsStyleSheetView(
          vs,
          n,
          table.nodeTable,
          table.edgeTable,
        )
      cy.add(cyNodes)
      cy.add(cyEdges)
      cy.style(defaultStyle)
    }

    if (cy != null) {
      cy.startBatch()
      cy.remove('*')
      computeStyleSheets ? styleSheetRender() : computedRender()
      cy.endBatch()
      cy.fit()
      cy.style().update()
    }
  }

  React.useEffect(() => {
    renderCyJs()
  })

  // React.useEffect(() => {
  //   renderCyJs()
  // }, [props.currentNetworkId, vs, table])

  React.useEffect(() => {
    const cy: Core = Cytoscape({
      container: cyContainer.current,
      hideEdgesOnViewport: true,
    })
    cy.resize()
    setCy(cy)
    renderCyJs()
  }, [])

  return (
    <Box
      sx={{ width: '100%', height: '100%' }}
      id="cy-container"
      ref={cyContainer}
    >
      {/* {JSON.stringify({ id: n.id, nodes: n.nodes, edges: n.edges }, null, 2)} */}
    </Box>
  )
}
