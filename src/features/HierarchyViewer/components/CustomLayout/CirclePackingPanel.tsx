import { Box, Tooltip } from '@mui/material'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Selection from 'd3-selection'
import * as d3Zoom from 'd3-zoom'
import { useEffect, useRef, useState } from 'react'
import { Network } from '../../../../models/NetworkModel'
import {
  CirclePackingType,
  createCirclePackingView,
  createTreeLayout,
} from './CirclePackingLayout'
import { getColorMapper } from './CirclePackingUtils'
import { D3TreeNode } from './D3TreeNode'
import { useViewModelStore } from '../../../../store/ViewModelStore'
import { NetworkView, NodeView } from '../../../../models/ViewModel'
import { IdType } from '../../../../models/IdType'
import { CirclePackingView } from '../../model/CirclePackingView'
import { useVisualStyleStore } from '../../../../store/VisualStyleStore'
import {
  VisualPropertyValueType,
  VisualStyle,
} from '../../../../models/VisualStyleModel'
import { applyVisualStyle } from '../../../../models/VisualStyleModel/impl/VisualStyleFnImpl'
import { useSubNetworkStore } from '../../store/SubNetworkStore'
import { useTableStore } from '../../../../store/TableStore'

interface CirclePackingPanelProps {
  network: Network
}

/**
 * Default styling values
 *
 * TODO: store these in the Visual Style model
 *
 */
const CpDefaults = {
  borderColor: '#666',
  selectedBorderColor: 'orange',
  leafBorderColor: 'red',
  borderWidth: 0.05,
  borderWidthHover: 0.3,
} as const

const CP_WRAPPER_CLASS = 'circle-packing-wrapper'

// type CpDefaultsType = typeof CpDefaults[keyof typeof CpDefaults]

/**
 * Circle Packing renderer as a variant of the network viewer
 *
 *
 */
export const CirclePackingPanel = ({
  network,
}: CirclePackingPanelProps): JSX.Element => {
  // Use this ref to access the SVG element generated by D3
  const ref = useRef(null)

  // Use this ref to access the parent element for checking the dimensions
  const refParent = useRef<HTMLDivElement>(null)

  // Check if the component is initialized
  const initRef = useRef(false)

  // Dimensions of the parent element
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // For keeping track of the selected leaf node which does not exist in the original network
  const [selectedLeaf, setSelectedLeaf] = useState<string>('')

  const networkId: IdType = network.id
  const tables = useTableStore((state) => state.tables)
  const { nodeTable, edgeTable } = tables[networkId] ?? {}

  // Use visual style store for getting the visual style
  const visualStyles: Record<string, VisualStyle> = useVisualStyleStore(
    (state) => state.visualStyles,
  )

  const visualStyle: VisualStyle = visualStyles[networkId]

  // For adding newly created Circle Packing view model
  const addViewModel = useViewModelStore((state) => state.add)
  const getViewModel = useViewModelStore((state) => state.getViewModel)
  const viewModelMap: Record<IdType, NetworkView[]> = useViewModelStore(
    (state) => state.viewModels,
  )
  const views: NetworkView[] = viewModelMap[networkId] ?? []

  // For updating the selected nodes
  const exclusiveSelect = useViewModelStore((state) => state.exclusiveSelect)

  // Find CP View Model
  const circlePackingView: CirclePackingView | undefined = views.find(
    (view) => view.type === CirclePackingType,
  ) as CirclePackingView

  // Pick the first selected node
  const selected: string = circlePackingView?.selectedNodes[0]

  // For tooltip
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)
  const [tooltipContent, setTooltipContent] = useState<string>('')
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  // For selecting nodes in the sub network view
  const setSelectedNodes = useSubNetworkStore((state) => state.setSelectedNodes)

  /**
   * Setup listener for resizing the SVG element
   */
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) {
        return
      }
      const entry = entries[0]
      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    if (refParent.current) {
      observer.observe(refParent.current)
    }

    return () => {
      if (refParent.current) {
        observer.unobserve(refParent.current)
      }
    }
  }, [])

  /**
   * Based on the network data and original view model, create a Circle Packing view model
   */
  useEffect(() => {
    if (network === undefined || nodeTable === undefined) return
    const primaryView = getViewModel(networkId)
    if (primaryView === undefined) return

    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> = createTreeLayout(
      network,
      nodeTable,
    )

    const updatedView = applyVisualStyle({
      network: network,
      visualStyle: visualStyle,
      nodeTable: nodeTable,
      edgeTable: edgeTable,
      networkView: primaryView,
    })
    const cpViewModel: CirclePackingView = createCirclePackingView(
      updatedView,
      rootNode,
    )
    addViewModel(network.id, cpViewModel)
  }, [network, visualStyle])

  const getLabel = (nodeId: string): string => {
    let label: VisualPropertyValueType = ''
    const nodeViews = circlePackingView?.nodeViews
    if (nodeViews !== undefined) {
      const nv: NodeView = nodeViews[nodeId]
      if (nv !== undefined) {
        label = nv.values.get('nodeLabel') as VisualPropertyValueType
      }
    }
    return label.toString()
  }

  const showObjects = (
    d: d3Hierarchy.HierarchyNode<D3TreeNode>,
    maxDepth: number,
  ): string => {
    if (d.depth === 0 || d.depth <= maxDepth) {
      return 'inline'
    } else {
      return 'none'
    }
  }

  const colorScale = getColorMapper([0, 1000])

  const updateForZoom = (maxDepth: number): void => {
    d3Selection
      .selectAll('circle')
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string =>
        showObjects(d, maxDepth),
      )

    d3Selection
      .selectAll('text')
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string => {
        // Zooming logic:
        // 1. If the node is the root node, always hide the label
        // 2. If leaf node, hide the label if the zoom level is below the threshold
        // 3. If non-leaf node, show the label based on the expansion level
        const isLeaf: boolean = d.height === 0

        if (d.depth !== 0 && d.depth === maxDepth) {
          return 'inline'
        } else if (isLeaf && d.depth < maxDepth) {
          return 'inline'
        } else {
          return 'none'
        }
      })
  }

  const handleZoom = (e: any): void => {
    const selectedArea = d3Selection.select('svg g')
    selectedArea.attr('transform', e.transform)
    const currentZoomLevel = e.transform.k
    const maxDepth = Math.ceil(currentZoomLevel)
    updateForZoom(maxDepth)
  }

  const toCenter = (svg: any): void => {
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    // Get the radius of the circle
    const radius = svg.select('circle').attr('r')

    const adjustedX = centerX - radius
    const adjustedY = centerY - radius

    svg.attr('transform', `translate(${adjustedX}, ${adjustedY})`)
  }

  const getFontSize = (d: d3Hierarchy.HierarchyCircularNode<any>): number => {
    return (d.r / 80) * 20
  }

  const draw = (rootNode: d3Hierarchy.HierarchyNode<D3TreeNode>): void => {
    // const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> =
    //   circlePackingView?.hierarchy as d3Hierarchy.HierarchyNode<D3TreeNode>
    const pack = d3Hierarchy
      .pack()
      .size([dimensions.width, dimensions.width])
      .padding(0)
    pack(rootNode)

    // Pick the base tag
    const svg: any = d3Selection.select(ref.current)
    const wrapper = svg.append('g').attr('class', CP_WRAPPER_CLASS)

    wrapper
      .append('g')
      .selectAll('circle')
      .data(rootNode.descendants())
      .join('circle')
      .attr('cx', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('cy', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .attr('r', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.r)
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<any>) =>
        selected === d.data.id
          ? CpDefaults.selectedBorderColor
          : CpDefaults.borderColor,
      )
      .attr('stroke-width', (d: d3Hierarchy.HierarchyCircularNode<any>) => {
        return d.data.id === selected || d.data.originalId === selected
          ? CpDefaults.borderWidthHover
          : CpDefaults.borderWidth
      })
      .attr('fill', (d: d3Hierarchy.HierarchyNode<D3TreeNode>) => {
        return colorScale(d.depth * 200)
      })
      .on(
        'mouseenter',
        function (e: any, d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
          setHoveredEnter(d.data)
        },
      )
      .on('click', function (e: any, d: d3Hierarchy.HierarchyNode<D3TreeNode>) {
        if (d.height !== 0) {
          if (d.data.originalId !== undefined) {
            exclusiveSelect(network.id, [d.data.originalId], [])
          } else {
            exclusiveSelect(network.id, [d.data.id], [])
          }
        } else {
          // This is a leaf node

          // Set always one node by clicking on the leaf node
          setSelectedNodes([d.data.name])

          // Select the parent node instead
          const { parent } = d
          if (parent === null || parent === undefined) return

          const selectedChild = d.data.originalId ?? d.data.id
          setSelectedLeaf(selectedChild)

          if (parent.data.originalId !== undefined) {
            exclusiveSelect(network.id, [parent.data.originalId], [])
          } else {
            exclusiveSelect(network.id, [parent.data.id], [])
          }
        }
      })
      .on('mousemove', function (e: any) {
        setTooltipPosition({ x: e.clientX + 20, y: e.clientY + 20 })
      })

    wrapper
      .append('g')
      .selectAll('text')
      .data(rootNode.descendants())
      .join('text')
      .each(function (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) {
        // Add the label on top of the circle
        let label: string = getLabel(d.data.id)
        if(label === '') {
          label = d.data.name
        }

        // Split the label into words
        const words = label.split(' ')

        const fontSize = getFontSize(d)
        // Calculate the total height of the text
        const textHeight: number = words.length * fontSize
        // Create a tspan for each word
        words.forEach((word: string, lineNumber: number) => {
          d3Selection
            .select(this)
            .append('tspan')
            .text(word)
            .attr('x', d.x)
            .attr(
              'y',
              d.y + lineNumber * fontSize * 1.2 - textHeight / 2 + fontSize / 2,
            ) // Adjust the y position based on the line number
            .style('user-select', 'none')
        })
      })
      .attr(
        'font-size',
        (d: d3Hierarchy.HierarchyCircularNode<any>) => `${d.r / 70}em`,
      )
      .attr('text-anchor', 'middle')
      .attr('x', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.x)
      .attr('y', (d: d3Hierarchy.HierarchyCircularNode<any>) => d.y)
      .style('display', (d: d3Hierarchy.HierarchyNode<D3TreeNode>): string => {
        const isLeaf: boolean = d.height === 0
        const isRoot: boolean = d.depth === 0
        return isLeaf || isRoot ? 'none' : 'inline'
      })

    // Initialized

    // Now this should work
    const zoom = d3Zoom.zoom().scaleExtent([0.1, 40]).on('zoom', handleZoom)
    svg.call(zoom)
    updateForZoom(1)
    toCenter(wrapper)
  }

  useEffect(() => {
    if (
      ref.current === null ||
      initRef.current ||
      network === undefined ||
      dimensions.width === 0 ||
      dimensions.height === 0
    )
      return

    if (circlePackingView === undefined) return

    const rootNode: d3Hierarchy.HierarchyNode<D3TreeNode> =
      circlePackingView?.hierarchy as d3Hierarchy.HierarchyNode<D3TreeNode>
    draw(rootNode)
    console.log('Initialized')
    initRef.current = true
  }, [circlePackingView, dimensions])

  const [hoveredEnter, setHoveredEnter] = useState<D3TreeNode>()
  useEffect(() => {
    if (hoveredEnter === undefined) {
      setTooltipOpen(false)
      return
    }

    let label: string = getLabel(hoveredEnter.id)
    if(label === '') {
      label = hoveredEnter.name
    }
    setTooltipContent(label)
    setTooltipOpen(true)
    const timeoutId = setTimeout(() => {
      setTooltipOpen(false)
    }, 2000)

    // Clear the timeout when the component unmounts
    return () => {
      clearTimeout(timeoutId)
    }
  }, [hoveredEnter])

  useEffect(() => {
    // Update the stroke color of the circles based on whether their node is selected
    d3Selection
      .select('.circle-packing-wrapper')
      .selectAll('circle')
      .attr('stroke', (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) => {
        if (d.data.id === selected) {
          return CpDefaults.selectedBorderColor
        } else if (d.data.name === selectedLeaf) {
          return CpDefaults.leafBorderColor
        } else {
          return CpDefaults.borderColor
        }
      })
      .attr(
        'stroke-width',
        (d: d3Hierarchy.HierarchyCircularNode<D3TreeNode>) =>
          d.data.id === selected ||
          d.data.id === selectedLeaf ||
          d.data.name === selectedLeaf
            ? CpDefaults.borderWidthHover
            : CpDefaults.borderWidth,
      )
    console.log('Selected LF updated', selectedLeaf)
  }, [circlePackingView?.selectedNodes, selectedLeaf])

  return (
    <Box ref={refParent} sx={{ width: '100%', height: '100%' }}>
      {network !== undefined ? (
        <svg ref={ref} width={dimensions.width} height={dimensions.height} />
      ) : null}
      <Tooltip
        open={tooltipOpen}
        // title={"TEST"}
        title={tooltipContent}
        style={{
          position: 'fixed',
          top: tooltipPosition.y,
          left: tooltipPosition.x,
        }}
      >
        <div />
      </Tooltip>
    </Box>
  )
}
