import { Network } from '../../models/NetworkModel'
import { Table, ValueType, ValueTypeName } from '../../models/TableModel'
import { NetworkView } from '../../models/ViewModel'
import { VisualStyle } from '../../models/VisualStyleModel'
import { VisualStyleOptions } from '../../models/VisualStyleModel/VisualStyleOptions'

export interface FileUploadProps {
  show: boolean
  handleClose: () => void
}

export enum SupportedFileType {
  CX2 = 'cx2',
  CSV = 'csv',
  TXT = 'txt',
  TSV = 'tsv',
}

export interface FullNetworkData {
  network: Network
  nodeTable: Table
  edgeTable: Table
  visualStyle: VisualStyle
  networkView: NetworkView
  visualStyleOptions: VisualStyleOptions
}
