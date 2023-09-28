import { Box } from '@mui/material'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Selection from 'd3-selection'

import { useEffect, useRef } from 'react'
import { colorScale } from './CirclePackingUtils'
import { Network } from '../../../../models/NetworkModel'
import { Table } from '../../../../models/TableModel'
import { D3TreeNode, createTreeLayout } from './CirclePackingLayout'

interface CirclePackingPanelProps {
  width: number
  height: number
  network?: Network
  nodeTable: Table
  edgeTable: Table
}

// interface CirclePackingNode {
//   name: string
//   children?: CirclePackingNode[]
//   value?: number
//   x: number
//   y: number
//   r: number
// }
/**
 * Simple circle packing layout
 *
 * TODO: Add interactivity
 *
 * @param param0
 * @returns
 */
export const CirclePackingPanel = ({
  width,
  height,
  network,
  nodeTable,
  edgeTable,
}: CirclePackingPanelProps): JSX.Element => {
  if (network === undefined) {
    return <></>
  }

  // Use this ref to access the SVG element generated by D3
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current === null) return
    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> = createTreeLayout(
      network,
      nodeTable,
      edgeTable,
    )
    console.log('rootNode', rootNode)

    const pack = d3Hierarchy.pack().size([width, height]).padding(3)

    pack(rootNode)

    const svg = d3Selection.select(ref.current)

    let counter = 0
    const node = svg
      .selectAll('circle')
      .data(rootNode.descendants())
      .join('circle')

    node
      .attr('cx', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('cy', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('r', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.r)
      .attr('stroke', '#555555')
      .attr('stroke-width', 0.5)
      .attr('fill', (d) => {
        if (d.data.isDuplicate === true) {
          counter++
          return 'red'
        } else {
          return colorScale(d.depth)
        }
      })

    const text = node.append('text')

    // Add a tspan for each CamelCase-separated word.
    text
      .selectAll()
      .data((d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) => d.data.id)
      .join('tspan')
      .attr('x', 0)
      .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
      .text((d: string) => d)
    console.log('counter', counter)
  }, [])

  return (
    <Box sx={{ width: '100%', height: '100%', border: '2px solid red' }}>
      <svg ref={ref} width={width} height={height} />
    </Box>
  )
}
