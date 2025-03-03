/**
 * A dialog to add / remove disable the apps
 */
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Link,
  Divider,
  useTheme,
  Theme,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

import { useAppStore } from '../../store/AppStore'
import { ServiceApp } from '../../models/AppModel/ServiceApp'
import { useContext, useEffect, useState } from 'react'

import { AppConfig, AppConfigContext } from '../../AppConfigContext'

interface ServiceSettingsDialogProps {
  openDialog: boolean
  setOpenDialog: (open: boolean) => void
}

export const ServiceSettingsDialog = ({
  openDialog,
  setOpenDialog,
}: ServiceSettingsDialogProps) => {
  const theme: Theme = useTheme()

  const { defaultServices } = useContext<AppConfig>(AppConfigContext)

  const [newUrl, setNewUrl] = useState<string>('')

  // Warning message to display when the user tries to add
  // a service that is already registered
  const [warningMessage, setWarningMessage] = useState<string>('')

  const serviceApps: Record<string, ServiceApp> = useAppStore(
    (state) => state.serviceApps,
  )

  const removeService = useAppStore((state) => state.removeService)

  const addService = useAppStore((state) => state.addService)

  useEffect(() => {
    const currentServiceUrls = Object.values(serviceApps).map(
      (serviceApp: ServiceApp) => serviceApp.url,
    )
    const urlSet = new Set(currentServiceUrls)

    defaultServices.forEach((url: string) => {
      if (!urlSet.has(url)) {
        addService(url)
      }
    })
  }, [])

  const handleAddServiceApp = async () => {
    
    let trimmedUrl: string = newUrl.trim()
    if (trimmedUrl.endsWith('/')) {
      trimmedUrl = trimmedUrl.slice(0, -1) // Remove the last character if it is '/'
    }

    if (trimmedUrl !== '') {
      const serviceApp = serviceApps[trimmedUrl]
      if (serviceApp !== undefined) {
        setWarningMessage(`The service already registered: ${trimmedUrl}`)
        return
      }
      await addService(trimmedUrl)
      setNewUrl('')
      setWarningMessage('')
    }
  }

  const handleDeleteServiceApp = (url: string) => {
    removeService(url)
  }

  const [isInputValid, setIsInputValid] = useState(false);
  const isValidUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return !!parsedUrl.protocol && !!parsedUrl.hostname;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    const trimmedValue = value.trim();
    setNewUrl(trimmedValue);
    setIsInputValid(isValidUrl(trimmedValue));
  };

  const handleClearUrl = () => {
    setNewUrl('')
    setWarningMessage('')
  }

  return (
    <Dialog open={openDialog}>
      <DialogTitle>External Services</DialogTitle>
      <DialogContent>
        {warningMessage && (
          <Typography color="error" variant="body2">
            {warningMessage}
          </Typography>
        )}
        <List>
          {Object.values(serviceApps).map((serviceApp: ServiceApp) => (
            <ListItem key={serviceApp.url}>
              <ListItemText
                primary={
                  <Typography variant="h6">{serviceApp.name}</Typography>
                }
                secondary={
                  <>
                    <Typography
                      sx={{ display: 'inline' }}
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      Endpoint: &nbsp;
                      <Link
                        href={serviceApp.url}
                        target="_blank"
                        rel="noopener"
                      >
                        {serviceApp.url}
                      </Link>
                    </Typography>
                    <Box>
                      <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="body1"
                        color="text.primary"
                      >
                        {serviceApp.description}
                      </Typography>
                    </Box>
                  </>
                }
              />
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteServiceApp(serviceApp.url)}
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
        <Box
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            margin: 0,
            padding: 0,
          }}
        >
          <TextField
            label="Enter new external service URL"
            value={newUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            style={{ marginRight: theme.spacing(1) }}
            size="small"
            sx={{ flexGrow: 1 }}
            error={!isInputValid && newUrl.trim() !== ''}
            helperText={!isInputValid && newUrl.trim() !== '' ? 'Enter a valid URL' : ''}
          />
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClearUrl}
            disabled={newUrl.trim() === ''}
            sx={{ marginRight: theme.spacing(1), width: '4em' }}
          >
            Clear
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleAddServiceApp}
            disabled={!isInputValid || newUrl.trim() === ''}
            sx={{ width: '4em' }}
          >
            Add
          </Button>
        </Box>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
