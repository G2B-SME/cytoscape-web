import {
  ErrorResponse,
  CytoContainerResult,
  ServiceAlgorithm,
  CytoContainerRequest,
  CytoContainerRequestId,
  CytoContainerResultStatus,
  ServerStatus
} from '../model'

// get task result function
export const getTaskResult = async (
  serviceUrl: string,
  taskId: string,
): Promise<CytoContainerResult> => {
  const response = await fetch(`${serviceUrl}/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }

  const data: CytoContainerResult = await response.json()
  return data
}

// get all algorithms offered by the service
export const getAllAlgorithms = async (serviceUrl: string): Promise<ServiceAlgorithm[]> => {
  const response = await fetch(serviceUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  const responseData = await response.json()
  const data: ServiceAlgorithm[] = Object.values(responseData.algorithms)

  return data
}

// delete task function
export const deleteTask = async (
  serviceUrl: string,
  taskId: string,
): Promise<void> => {
  const response = await fetch(`${serviceUrl}/${taskId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
}

// get meta data about this service algorithm
export const getAlgorithmMetaData = async (
  serviceUrl: string,
): Promise<ServiceAlgorithm> => {
  const response = await fetch(serviceUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  const data: ServiceAlgorithm = await response.json()
  return data
}

// submit task function
export const submitTask = async (
  serviceUrl: string,
  task: CytoContainerRequest,
): Promise<CytoContainerRequestId> => {
  const response = await fetch(serviceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  const result: CytoContainerRequestId = await response.json()
  return result
}

// get task status function
export const getTaskStatus = async (
  serviceUrl: string,
  taskId: string,
): Promise<CytoContainerResultStatus> => {
  const response = await fetch(`${serviceUrl}/${taskId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  const status: CytoContainerResultStatus = await response.json()
  return status
}

// get server status function
export const getServerStatus = async (
  serverUrl: string,
): Promise<ServerStatus> => {
  const response = await fetch(`${serverUrl}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  const status: ServerStatus = await response.json()
  return status
}

// get algorithm status function
export const getAlgorithmStatus = async (
  serviceUrl: string,
): Promise<ServerStatus> => {
  const response = await fetch(`${serviceUrl}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const errorResponse: ErrorResponse = await response.json()
    throw new Error(errorResponse.message)
  }
  const status: ServerStatus = await response.json()
  return status
}
