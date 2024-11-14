import {
  List,
  Stack,
  Center,
  Button,
  Title,
  Group,
  Text,
  rem,
  Space,
  MantineProvider,
  Modal,
  Paper,
} from '@mantine/core'
import { IconUpload, IconX } from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import { notifications } from '@mantine/notifications'
import Papa from 'papaparse'
import { ModalsProvider, modals } from '@mantine/modals'
import { v4 as uuidv4 } from 'uuid'
import { Cx2 } from '../../models/CxModel/Cx2'
import {
  getAttributeDeclarations,
  getNetworkAttributes,
} from '../../models/CxModel/cx2-util'
import NetworkFn, { Network } from '../../models/NetworkModel'
import { NdexNetworkProperty } from '../../models/NetworkSummaryModel'
import TableFn, {
  Table,
  ValueType,
  ValueTypeName,
} from '../../models/TableModel'
import ViewModelFn, { NetworkView } from '../../models/ViewModel'
import VisualStyleFn, { VisualStyle } from '../../models/VisualStyleModel'
import { useNetworkStore } from '../../store/NetworkStore'
import { useTableStore } from '../../store/TableStore'
import { useViewModelStore } from '../../store/ViewModelStore'
import { useVisualStyleStore } from '../../store/VisualStyleStore'
import { useWorkspaceStore } from '../../store/WorkspaceStore'
import { putNetworkSummaryToDb } from '../../store/persist/db'
import {
  useCreateNetworkFromTableStore,
  CreateNetworkFromTableStep,
} from '../../features/TableDataLoader/store/createNetworkFromTableStore'
import { PrimeReactProvider } from 'primereact/api'
import { useNetworkSummaryStore } from '../../store/NetworkSummaryStore'
import { generateUniqueName } from '../../utils/network-utils'
import { VisualStyleOptions } from '../../models/VisualStyleModel/VisualStyleOptions'
import { useUiStateStore } from '../../store/UiStateStore'
import { FileUploadProps, FullNetworkData } from './FileUpload.types'
import { SupportedFileType } from './FileUpload.types'
import { FileDropzone } from '../Util/FileDropzone'

export function FileUpload(props: FileUploadProps) {
  const setCurrentNetworkId = useWorkspaceStore(
    (state) => state.setCurrentNetworkId,
  )

  const addNewNetwork = useNetworkStore((state) => state.add)

  const setVisualStyle = useVisualStyleStore((state) => state.add)

  const ui = useUiStateStore((state) => state.ui)
  const setVisualStyleOptions = useUiStateStore(
    (state) => state.setVisualStyleOptions,
  )

  const setViewModel = useViewModelStore((state) => state.add)

  const setTables = useTableStore((state) => state.add)

  const addNetworkToWorkspace = useWorkspaceStore(
    (state) => state.addNetworkIds,
  )
  const createDataFromLocalCx2 = async (
    LocalNetworkId: string,
    cxData: Cx2,
  ): Promise<FullNetworkData> => {
    const network: Network = NetworkFn.createNetworkFromCx(
      LocalNetworkId,
      cxData,
    )

    const [nodeTable, edgeTable]: [Table, Table] = TableFn.createTablesFromCx(
      LocalNetworkId,
      cxData,
    )

    const visualStyle: VisualStyle =
      VisualStyleFn.createVisualStyleFromCx(cxData)

    const networkView: NetworkView = ViewModelFn.createViewModelFromCX(
      LocalNetworkId,
      cxData,
    )

    const visualStyleOptions: VisualStyleOptions =
      VisualStyleFn.createVisualStyleOptionsFromCx(cxData)

    return {
      network,
      nodeTable,
      edgeTable,
      visualStyle,
      networkView,
      visualStyleOptions,
    }
  }

  const handleCX2File = async (jsonStr: string) => {
    try {
      const json = JSON.parse(jsonStr)
      let localName: string = ''
      for (const item of json) {
        if (
          Array.isArray(item.networkAttributes) &&
          item.networkAttributes.length > 0 &&
          item.networkAttributes[0] &&
          typeof item.networkAttributes[0].name === 'string'
        ) {
          localName = item.networkAttributes[0].name
          break
        }
      }
      let localDescription: string = ''
      for (const item of json) {
        if (
          Array.isArray(item.networkAttributes) &&
          item.networkAttributes.length > 0 &&
          item.networkAttributes[0] &&
          typeof item.networkAttributes[0].description === 'string'
        ) {
          localDescription = item.networkAttributes[0].description
          break
        }
      }
      const networkAttributeDeclarations =
        getAttributeDeclarations(json).attributeDeclarations[0]
          .networkAttributes
      const networkAttributes = getNetworkAttributes(json)[0]

      const localProperties: NdexNetworkProperty[] = Object.entries(
        networkAttributes,
      ).map(([key, value]) => {
        return {
          predicateString: key,
          value: value as ValueType,
          dataType: networkAttributeDeclarations[key].d ?? ValueTypeName.String,
          subNetworkId: null,
        }
      })

      const localUuid = uuidv4()
      const res = await createDataFromLocalCx2(localUuid, json)
      const {
        network,
        nodeTable,
        edgeTable,
        visualStyle,
        networkView,
        visualStyleOptions,
      } = res

      const localNodeCount = network.nodes.length
      const localEdgeCount = network.edges.length
      await putNetworkSummaryToDb({
        isNdex: false,
        ownerUUID: localUuid,
        name: localName,
        isReadOnly: false,
        subnetworkIds: [],
        isValid: false,
        warnings: [],
        isShowcase: false,
        isCertified: false,
        indexLevel: '',
        hasLayout: true,
        hasSample: false,
        cxFileSize: 0,
        cx2FileSize: 0,
        properties: localProperties,
        owner: '',
        version: '',
        completed: false,
        visibility: 'PUBLIC',
        nodeCount: localNodeCount,
        edgeCount: localEdgeCount,
        description: localDescription,
        creationTime: new Date(Date.now()),
        externalId: localUuid,
        isDeleted: false,
        modificationTime: new Date(Date.now()),
      })
      // TODO the db syncing logic in various stores assumes the updated network is the current network
      // therefore, as a temporary fix, the first operation that should be done is to set the
      // current network to be the new network id
      setVisualStyleOptions(localUuid, visualStyleOptions)
      addNetworkToWorkspace(localUuid)
      setCurrentNetworkId(localUuid)
      addNewNetwork(network)
      setVisualStyle(localUuid, visualStyle)
      setTables(localUuid, nodeTable, edgeTable)
      setViewModel(localUuid, networkView)
      props.handleClose()
    } catch (error) {
      onFileError(
        'Failed to process CX2 file. Please check the file format and try again.',
      )
      console.error(error)
    }
  }

  const summaries = useNetworkSummaryStore((state) => state.summaries)

  const setFile = useCreateNetworkFromTableStore((state) => state.setFile)
  const setShow = useCreateNetworkFromTableStore((state) => state.setShow)
  const goToStep = useCreateNetworkFromTableStore((state) => state.goToStep)
  const setRawText = useCreateNetworkFromTableStore((state) => state.setRawText)
  const setName = useCreateNetworkFromTableStore((state) => state.setName)
  const onFileError = (message: string) => {
    notifications.show({
      color: 'red',
      title: 'Error uploading file',
      message: message,
      autoClose: 5000,
    })
  }

  const handleTableFile = (file: File, text: string) => {
    // Parse CSV here using PapaParse
    // const result = Papa.parse(text)
    const name = generateUniqueName(
      Object.values(summaries).map((s) => s.name),
      file.name,
    )

    setFile(file)
    goToStep(CreateNetworkFromTableStep.ColumnAssignmentForm)
    setRawText(text)
    setName(name)
    setShow(true)
    props.handleClose()
  }

  const SUPPORTED_FILE_TYPES: SupportedFileType[] = [
    SupportedFileType.CSV,
    SupportedFileType.TXT,
    SupportedFileType.TSV,
  ]

  const onFileDrop = (file: File) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const text = reader.result as string
      if (!text.trim()) {
        onFileError('The uploaded file is empty.')
        return
      }
      const fileExtension = file.name.split('.').pop() as string
      if (fileExtension === SupportedFileType.CX2) {
        handleCX2File(text)
      } else if (
        SUPPORTED_FILE_TYPES.includes(fileExtension as SupportedFileType)
      ) {
        handleTableFile(file, text)
      } else {
        onFileError(
          'File type not supported. Please upload a valid .csv, .txt, .tsv, or .cx2 file.',
        )
      }
    })
    reader.readAsText(file)
  }

  return (
    <PrimeReactProvider>
      <MantineProvider>
        <ModalsProvider>
          <Modal
            onClose={() => props.handleClose()}
            opened={props.show}
            zIndex={2000}
            centered
            title={
              <Title c="gray" order={4}>
                Upload file
              </Title>
            }
          >
            <FileDropzone
              onDrop={onFileDrop}
              onReject={() =>
                onFileError(
                  'The uploaded file is not valid. Please upload a valid .csv, .txt, .tsv, or .cx2 file.',
                )
              }
              acceptedFileTypes={SUPPORTED_FILE_TYPES}
              errorMessage="The uploaded file is not valid"
              infoMessage="Drag a file here"
              buttonText="Browse"
            />
          </Modal>
        </ModalsProvider>
      </MantineProvider>
    </PrimeReactProvider>
  )
}
