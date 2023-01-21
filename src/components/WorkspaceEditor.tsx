import * as React from 'react'
import { Suspense, useContext, useEffect, useState } from 'react'
import { Allotment } from 'allotment'
import { Box, Tabs, Tab, Typography } from '@mui/material'
import ShareIcon from '@mui/icons-material/Share'
import PaletteIcon from '@mui/icons-material/Palette'
import debounce from 'lodash.debounce'
import TableBrowser from './TableBrowser'
import VizmapperView from './Vizmapper'

import { Outlet, useNavigate } from 'react-router-dom'

import { getNdexNetwork } from '../store/useNdexNetwork'
import { useTableStore } from '../store/TableStore'
import { useVisualStyleStore } from '../store/VisualStyleStore'
import { useNetworkStore } from '../store/NetworkStore'
import { useViewModelStore } from '../store/ViewModelStore'
import { useWorkspaceStore } from '../store/WorkspaceStore'
import { IdType } from '../models/IdType'
import { useNetworkSummaryStore } from '../store/NetworkSummaryStore'
import { NdexNetworkSummary } from '../models/NetworkSummaryModel'
import { AppConfigContext } from '../AppConfigContext'
import { Workspace } from '../models/WorkspaceModel'
import { Summaries as SummaryList } from './SummaryPanel'

const WorkSpaceEditor: React.FC = () => {
  // Server location
  const { ndexBaseUrl } = useContext(AppConfigContext)

  const navigate = useNavigate()

  const currentNetworkId: IdType = useWorkspaceStore(
    (state) => state.workspace.currentNetworkId,
  )
  const workspace: Workspace = useWorkspaceStore((state) => state.workspace)

  const setCurrentNetworkId: (id: IdType) => void = useWorkspaceStore(
    (state) => state.setCurrentNetworkId,
  )

  // Network Summaries
  const summaries: Record<IdType, NdexNetworkSummary> = useNetworkSummaryStore(
    (state) => state.summaries,
  )
  const fetchAllSummaries = useNetworkSummaryStore((state) => state.fetchAll)
  const removeSummary = useNetworkSummaryStore((state) => state.remove)

  const [tableBrowserHeight, setTableBrowserHeight] = useState(0)
  const [tableBrowserWidth, setTableBrowserWidth] = useState(window.innerWidth)
  const [currentTabIndex, setCurrentTabIndex] = useState(0)
  const [allotmentDimensions, setAllotmentDimensions] = useState<
    [number, number]
  >([0, 0])

  const changeTab = (event: React.SyntheticEvent, newValue: number): void => {
    setCurrentTabIndex(newValue)
  }

  const addNewNetwork = useNetworkStore((state) => state.add)

  // Visual Style Store
  const setVisualStyle = useVisualStyleStore((state) => state.set)
  // Table Store
  const setTables = useTableStore((state) => state.setTables)

  const setViewModel = useViewModelStore((state) => state.setViewModel)

  const loadNetworkSummaries = async (): Promise<void> => {
    await fetchAllSummaries(workspace.networkIds, ndexBaseUrl)
  }

  const loadCurrentNetworkById = async (networkId: IdType): Promise<void> => {
    try {
      const res = await getNdexNetwork(networkId, ndexBaseUrl)
      const { network, nodeTable, edgeTable, visualStyle, networkView } = res

      addNewNetwork(network)
      setVisualStyle(networkId, visualStyle)
      setTables(networkId, nodeTable, edgeTable)
      setViewModel(networkId, networkView)
      window.n = network
      window.nt = nodeTable
      window.et = edgeTable
      window.vs = visualStyle
      window.nv = networkView
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * Initializations
   */
  useEffect(() => {
    const windowWidthListener = debounce(() => {
      setTableBrowserWidth(window.innerWidth)
    }, 200)
    window.addEventListener('resize', windowWidthListener)

    return () => {
      window.removeEventListener('resize', windowWidthListener)
    }
  }, [])

  /**
   * Check number of networks in the workspace
   */
  useEffect(() => {
    const networkCount: number = workspace.networkIds.length
    const summaryCount: number = Object.keys(summaries).length
    // No action required if empty or no change
    if (networkCount === 0) {
      if (summaryCount !== 0) {
        // Remove the last one
        removeSummary(Object.keys(summaries)[0])
      }
      return
    }

    const summaryIds: IdType[] = [...Object.keys(summaries)]

    // Case 1: network removed
    if (networkCount < summaryCount) {
      const toBeRemoved: IdType[] = summaryIds.filter((id) => {
        return !workspace.networkIds.includes(id)
      })
      removeSummary(toBeRemoved[0])
      return
    }

    // Case 2: network added

    // TODO: Load only diffs
    loadNetworkSummaries()
      .then(() => {})
      .catch((err) => console.error(err))
  }, [workspace.networkIds])

  useEffect(() => {
    if (currentNetworkId !== '' && currentNetworkId !== undefined) {
      loadCurrentNetworkById(currentNetworkId)
        .then(() => {
          console.log('Network loaded for', currentNetworkId)
        })
        .catch((err) => console.error(err))

      // Set URL to current network ID
      navigate(`/${workspace.id}/networks/${currentNetworkId}`)
    }
  }, [currentNetworkId])

  useEffect(() => {
    let curId: IdType = ''
    if (Object.keys(summaries).length !== 0) {
      curId = Object.keys(summaries)[0]
    }
    setCurrentNetworkId(curId)
  }, [summaries])

  return (
    <Box sx={{ height: 'calc(100vh - 48px)' }}>
      <Allotment
        vertical
        onChange={debounce((sizes: number[]) => {
          // sizes[0] represents the height of the top pane (network list, network renderer, vizmapper)
          // sizes[1] represents the height of the bottom pane (table browser)
          setAllotmentDimensions([sizes[0], sizes[1]])
          setTableBrowserHeight(sizes[1])
        }, 200)}
      >
        <Allotment.Pane>
          <Allotment>
            <Allotment.Pane preferredSize="20%">
              <Box
                sx={{
                  height: '100%',
                }}
              >
                <Tabs
                  sx={{ display: 'flex', alignItems: 'center', height: '40px' }}
                  value={currentTabIndex}
                  onChange={changeTab}
                >
                  <Tab
                    icon={<ShareIcon />}
                    iconPosition="start"
                    label={<Typography variant="body2">WORKSPACE</Typography>}
                  />
                  <Tab
                    icon={<PaletteIcon />}
                    iconPosition="start"
                    label={<Typography variant="body2">STYLE</Typography>}
                  />
                </Tabs>
                <div hidden={currentTabIndex !== 0}>
                  {currentTabIndex === 0 && (
                    <Box
                      sx={{
                        overflow: 'scroll',
                        height: allotmentDimensions[0] - 48,
                        // need to set a height to enable scroll in the network list
                        // 48 is the height of the tool bar
                        width: '100%',
                      }}
                    >
                      <SummaryList summaries={summaries} />
                    </Box>
                  )}
                </div>
                <div hidden={currentTabIndex !== 1}>
                  {currentTabIndex === 1 && (
                    <Box>
                      {' '}
                      <Suspense
                        fallback={<div>{`Loading from NDEx`}</div>}
                        key={currentNetworkId}
                      >
                        <VizmapperView
                          currentNetworkId={currentNetworkId}
                          height={allotmentDimensions[0]}
                        />
                      </Suspense>
                    </Box>
                  )}
                </div>
              </Box>
            </Allotment.Pane>
            <Allotment.Pane>
              <Outlet /> {/* Network Renderer will be injected here */}
            </Allotment.Pane>
          </Allotment>
        </Allotment.Pane>
        <Allotment.Pane minSize={28} preferredSize={150}>
          <Suspense
            fallback={<div>{`Loading from NDEx`}</div>}
            key={currentNetworkId}
          >
            <TableBrowser
              height={tableBrowserHeight}
              width={tableBrowserWidth}
              currentNetworkId={currentNetworkId}
            />
          </Suspense>
        </Allotment.Pane>
      </Allotment>
    </Box>
  )
}

export default WorkSpaceEditor
