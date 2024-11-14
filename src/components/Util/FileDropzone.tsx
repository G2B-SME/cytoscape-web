import React from 'react'
import { Dropzone, DropzoneAccept, DropzoneReject } from '@mantine/dropzone'
import { Button, Group, Stack, Text, rem } from '@mantine/core'
import { IconUpload, IconX } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface FileDropzoneProps {
  onDrop: (file: File) => void
  onReject: (files: any) => void
  acceptedFileTypes: string[]
  errorMessage?: string
  infoMessage?: string
  buttonText?: string
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onDrop,
  onReject,
  acceptedFileTypes,
  errorMessage,
  infoMessage,
  buttonText = 'Browse',
}) => {
  const handleFileError = () => {
    notifications.show({
      color: 'red',
      title: 'Error uploading file',
      message: errorMessage || 'The uploaded file is not valid.',
      autoClose: 5000,
    })
  }

  return (
    <Dropzone
      onDrop={(files: any) => {
        onDrop(files[0])
      }}
      onReject={(files: any) => {
        onReject(files)
        handleFileError()
      }}
      accept={acceptedFileTypes}
    >
      <Group
        justify="center"
        gap="xl"
        mih={220}
        style={{ pointerEvents: 'none' }}
      >
        <DropzoneAccept>
          <IconUpload
            style={{
              width: rem(52),
              height: rem(52),
              color: 'var(--mantine-color-blue-6)',
            }}
            stroke={1.5}
          />
        </DropzoneAccept>
        <DropzoneReject>
          <IconX
            style={{
              width: rem(52),
              height: rem(52),
              color: 'var(--mantine-color-red-6)',
            }}
            stroke={1.5}
          />
        </DropzoneReject>

        <Stack align="center">
          <Button>{buttonText}</Button>
          <Text size="xl" inline>
            {infoMessage || 'Or drag a file here'}
          </Text>
          <Text size="sm" c="dimmed" inline mt={7}>
            {acceptedFileTypes.length > 1
              ? `Accepted file types: ${acceptedFileTypes.join(', ')}`
              : `Files under 5mb supported`}
          </Text>
        </Stack>
      </Group>
    </Dropzone>
  )
}
