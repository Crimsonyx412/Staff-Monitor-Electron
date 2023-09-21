import React, { useRef, useState, useEffect } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'

import { proxy } from '../actions/config'
import useEffectOnce from '../components/useEffectOnce'

// create screenshot and count the keyboard press and mouse click.
const SaveActions = (props) => {
  const timer = useRef(null)
  const session = useSelector((state) => state.project.curSession)

  const [mouseCnt, setMouseClicked] = useState(0)
  const [keyCnt, setKeyDown] = React.useState(0)
  const [timePassed, setTimePassed] = useState(0)
  const [appInfos, setAppInfos] = useState([])
  const [browsers, setbrowsers] = useState([]) // name, title, timeUsed

  useEffectOnce(() => {
    timer.current = setInterval(() => {
      setTimePassed((prev) => prev + 1)
    }, 1000) // create screenshot and save the key&mouse event in every 3 minutes

    return () => {
      timer.current && clearInterval(timer.current)
      timer.current = null
    }
  }, [])
  // && timePassed % 180 === 0
  useEffect(() => {
    if (timePassed !== 0 && timePassed % 180 === 0 && session) {
      createScreenShot()
      saveAppInfo()
    } else if (session) {
      getAppInfo()
    }
  }, [timePassed, browsers])

  useEffect(() => {
    // receive mouse click and key press event
    const mouseClickEvent = (event, data) => {
      setMouseClicked((prev) => prev + 1)
    }
    window.electron.ipcRenderer.on('mouseclick', mouseClickEvent)

    const keydownEvent = (event, data) => {
      setKeyDown((prev) => prev + 1)
    }

    window.electron.ipcRenderer.on('keydown', keydownEvent)
    window.electron.ipcRenderer.send('onGetInstalledBrowsers')
    window.electron.ipcRenderer.on('installedBrowsers', (_, data) => {
      setbrowsers(data)
    })

    return () => {
      window.electron.ipcRenderer.off('mouseclick', mouseClickEvent)
      window.electron.ipcRenderer.off('keydown', keydownEvent)
    }
  }, [])

  const getAppInfo = async () => {
    const { activeWindow } = window.electron
    const info = await activeWindow()
    if (info && info.title) {
      let find = null
      const type =
        [
          'Google Chrome',
          'Vivaldi',
          'Safari',
          'Firefox',
          'Brave Browser',
        ].indexOf(info.owner.name) === -1
          ? 'application'
          : 'website'
      //const type = browsers.indexOf(info.owner.name) === -1 ? "application" : "website";

      if (type === 'application') {
        find = appInfos.find(
          (item) =>
            item.nameDetail === info.title &&
            item.name === info.owner.name &&
            item.sessionId === (session ? session.id : null)
        )
      } else {
        find = appInfos.find(
          (item) =>
            item.nameDetail === info.title &&
            item.sessionId === (session ? session.id : null)
        )
      }

      if (find) {
        //console.log(find)
        if (type === 'application') {
          setAppInfos(
            [].concat(
              appInfos.map((item) => {
                if (
                  item.nameDetail === info.title &&
                  item.sessionId === (session ? session.id : null) &&
                  //&& (type === ("website" || "application") && item.name === info.owner.name)
                  type === 'application' &&
                  item.name === info.owner.name
                ) {
                  //console.log(item)
                  return { ...item, timeUsed: item.timeUsed + 1 }
                }

                return item
              })
            )
          )
        } else {
          setAppInfos(
            [].concat(
              appInfos.map((item) => {
                if (
                  item.nameDetail === info.title &&
                  type === 'website' &&
                  item.sessionId === (session ? session.id : null)
                ) {
                  //console.log(item)
                  return { ...item, timeUsed: item.timeUsed + 1 }
                }
                return item
              })
            )
          )
        }
      } else {
        const data = {
          nameDetail: info.title,
          type,
          sessionId: session ? session.id : null,
          timeUsed: 1,
          name: type === 'application' ? info.owner.name : '',
        }

        setAppInfos(appInfos.concat(data))
      }
    }
  }

  const saveAppInfo = () => {
    setAppInfos((appInfos) => {
      let _data = [...appInfos]
      window.electron.ipcRenderer.send('getBrowerHistory', _data)
      window.electron.ipcRenderer.once('getBrowerHistory', (event, result) => {
        result.forEach((item) => {
          try {
            axios.post(
              proxy + 'https://panel.staffmonitor.app/api/app-log',
              item
            )
          } catch (err) {
            console.log(err, item)
          }
        })
      })

      return []
    })
  }

  const getProfile = async () => {
    try {
      const res = await axios.get(
        proxy + 'https://panel.staffmonitor.app/api/profile'
      )
      return res.data
    } catch (error) {
      console.log(error)
      return { blurScreencasts: 0, takeScreencasts: 0 }
    }
  }

  const createScreenShot = async () => {
    const { takeScreencasts, blurScreencasts } = await getProfile()

    try {
      if (!takeScreencasts) {
        window.electron.ipcRenderer.send('getFakescreenshot', {
          session,
          mouseCnt,
          keyCnt,
        })
      } else {
        window.electron.ipcRenderer.send('captureScreenshot', {
          session,
          mouseCnt,
          keyCnt,
          blurScreencasts,
        })
      }
      setMouseClicked(0)
      setKeyDown(0)
    } catch (err) {
      console.error(err)
    }
  }

  return <>{props.children}</>
}

export default SaveActions
