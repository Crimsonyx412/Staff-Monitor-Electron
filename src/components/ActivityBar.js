import React, { useState } from 'react'
import Button from '@mui/material/Button'
import StopIcon from '@mui/icons-material/Stop'
import CloseIcon from '@mui/icons-material/Close'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import CircularProgress from './CircularProgress'

import { formatTime } from '../module'
import UseEffectOnce from './useEffectOnce'

export default function () {
  const [isWorking, setWorking] = useState(false)
  const [projectName, setProject] = useState(
    'Testing Feature on Linux Mint 18.1'
  )
  const [workedTime, setWorkedTime] = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const [isBreaking, setIsBreaking] = useState(false)

  UseEffectOnce(() => {
    let timer = null

    window.electron.ipcRenderer.on(
      'fromMainWindowBreakStatus',
      (event, data) => {
        setIsBreaking(data)
        setIsFetching(false)
      }
    )

    window.electron.ipcRenderer.on('fromMainWindow', (event, data) => {
      setIsBreaking(false)
      if (data.working) {
        setWorking(data.working)
        setProject(data.name)
        setWorkedTime(data.startInterval)
        timer && clearInterval(timer)
        timer = setInterval(() => {
          setWorkedTime((prev) => prev + 1)
        }, 1000)
      } else {
        setWorking(false)
        setProject('')
        setWorkedTime(0)
        timer && clearInterval(timer)
      }
      setIsFetching(false)
    })
    return () => {
      clearInterval(timer)
    }
  }, [])

  function closeWindow() {
    window.electron.ipcRenderer.send('closeWindow')
  }

  function showMainWindow() {
    window.electron.ipcRenderer.send('showMainWindow')
  }

  function handleWorking() {
    setIsFetching(true)
    window.electron.ipcRenderer.send('sendDataToMainWindow', {
      working: isWorking,
      breaking: isBreaking,
    })
  }
  return (
    <div className='activity-bar'>
      <div className='left'>
        <img
          className='logo'
          src='assets/imgs/revert.png'
          alt='logo here'
          onClick={showMainWindow}
        />
        {!isBreaking && !isFetching && (
          <Button
            variant='contained'
            className='icon-button'
            onClick={handleWorking}
          >
            {isWorking ? <StopIcon /> : <PlayArrowIcon />}
          </Button>
        )}
        {isBreaking && !isFetching && (
          <Button
            variant='contained'
            className='icon-button'
            onClick={handleWorking}
          >
            <PauseIcon color='error' />
          </Button>
        )}
        {isFetching && (
          <CircularProgress className='circular-progress-secondary' />
        )}
        {!isFetching && isWorking && (
          <>
            <div className={!isBreaking ? 'dot' : 'reddot'}></div>
            <span className='project'>{projectName}</span>
          </>
        )}
      </div>
      <div className='right'>
        <span className='time'>{formatTime(workedTime)}</span>
        <Button
          variant='contained'
          className='icon-button close'
          onClick={closeWindow}
        >
          <CloseIcon />
        </Button>
      </div>
    </div>
  )
}
