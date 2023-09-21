import React, {
  useState,
  useEffect,
  useRef
} from 'react';
import {
  useDispatch,
  useSelector
} from 'react-redux';
import axios from "axios"

import Button from '@mui/material/Button';
import StopIcon from '@mui/icons-material/Stop';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CircularProgress from "./CircularProgress"

import MonitorModal from './MonitorModal';
import ReminderModal from './ReminderModal';

import useEffectOnce from "./useEffectOnce"
import { proxy } from "../actions/config"
import { formatTime } from "../module"

import {
  selectProject,
  changeSession
} from "../actions/project"


const cutProjectName = (cName)=>{

  if(cName.length>35){
    return `${cName.slice(0, 35)}...`
  }

  return cName 

}

const Header = () => {
  // redux
  const selectedProject = useSelector((state) => state.project.selectedProject);
  const dispatch = useDispatch()

  // states
  const [workInfo, setWorkInfo] = useState({})
  const [breakInfo, setBreakInfo] = useState({});

  const [isWorking, setIsWorking] = useState(false)
  const [isBreaking, setIsBreaking] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const [workedTime, setWorkedTime] = useState(0)
  const [breakedTime, setBreakedTime] = useState(0)

  const [summary, setSummary] = useState("1h 59mins")

  // from sub window
  const [subWinData, setSubWinData] = useState(null)

  // timers
  const workTimer = useRef(null);
  const breakTimer = useRef(null);

  useEffectOnce(() => {

    // check there is working & break time
    axios
      .get(proxy + "https://panel.staffmonitor.app/api/sessions?page=1&per-page=1", {
        params: {
          "per-page": 1,
          "sort": "-clockIn",
          "filter": { "clockOut": null }
        }
      }).then(res => {
        if (res.data.length > 0
          && !res.data[0].clockOut
        ) {
          startWork(res.data[0])
          dispatch(selectProject(res.data[0].project, true))
          axios
            .get(proxy + "https://panel.staffmonitor.app/api/breaks", {
              params: {
                "page": 1,
                "per-page": 20,
                "sort": "start",
                "filter": { "sessionId": res.data[0].id }
              }
            }).then(res => {
              if (res.data.length > 0) {
                const temp = res.data.find(item => item.end === null)

                if (temp)
                  startBreak(temp)
              }
            })
        }
      })

    getSummary()

    window.electron.ipcRenderer.on("fromSubWindow", (event, data) => {
      
      setSubWinData(data)

    })

    return () => {
      workTimer.current && clearInterval(workTimer.current)
      breakTimer.current && clearInterval(breakTimer.current)
      workTimer.current = null;
      breakTimer.current = null;
    }
  }, [])

  useEffect(() => {
    
    if (subWinData) {

      if (subWinData.working) {

        if(!subWinData.breaking){
          endWork()
        }else{
          breakButtonClicked()
        }
        
      } else {

        createSession()

      }

    }

  }, [subWinData])

  useEffect(() => {
    if (
      selectedProject
      && !selectedProject.notInit
    ) {
      if (isWorking) {
        endWork(() => {
          createSession(selectedProject)
        })
      } else {
        startButtonClicked(selectedProject)
      }
    }
  }, [selectedProject])

  const getSummary = () => {
    var start = new Date(), end = new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    axios
      .get(proxy + "https://panel.staffmonitor.app/api/sessions",
        {
          params: {
            'filter': {
              'clockIn': {
                'gte': Math.floor(start / 1000),
                'lt': Math.floor(end / 1000)
              }
            }
          }
        })
      .then(res => {
        let summarySeconds = 0;
        res.data.forEach(item => {
          if (!item.clockOut)
            summarySeconds += (Math.floor(Date.now() / 1000) - item.clockIn)
          else
            summarySeconds += (item.clockOut - item.clockIn)
        })
        setSummary(summarySeconds)
      })
  }

  const passedTime = (time) => {
    return Math.floor((Date.now() / 1000 - time));
  }

  const startWork = (data) => {
    window.electron.ipcRenderer.send("showActivityBar")
    dispatch(changeSession(data))
    setWorkInfo(data)
    setIsWorking(true)
    sendDataToSubWindow({
      startInterval: passedTime(data.clockIn),
      name: data.project ? data.project.name : '',
      working: true
    })
    workTimer.current = setInterval(() => {
      setWorkedTime(passedTime(data.clockIn))
    }, 1000)

  }

  const endWork = async (callback = null) => {
    
    setIsFetching(true)
    axios
      .put(
        proxy + `https://panel.staffmonitor.app/api/sessions/${workInfo.id}`,
        { clockOut: Math.floor(Date.now() / 1000) }
      )
      .then(res => {

        
        dispatch(changeSession(null))
        setIsWorking(false)
        setWorkedTime(0)
        setIsBreaking(false)
        setBreakedTime(0)

        if (!callback)
          dispatch(selectProject(null))

        clearInterval(workTimer.current)
        breakTimer.current && clearInterval(breakTimer.current)
        callback && callback()
        getSummary()
        sendDataToSubWindow({ working: false })
        setIsFetching(false)

      }).catch(err => {
        setIsFetching(false)
        sendDataToSubWindow({ working: false })
        if (
          err
          && err.response
          && err.response.data
        ) {
          let errors = err.response.data;
          errors.length > 0
            && alert(errors[0].message)
        }
      })
  }

  const startBreak = (data, type = 3) => {
    
    setBreakInfo(data)
    setIsBreaking(true)
    sendDataToSubWindowBreakStatus(true)

    breakTimer.current = setInterval(() => {
      if (type === 1) {
        if (passedTime(data.start) > 900)
          return endBreak(data.id)
      } else if (type === 2) {
        if (passedTime(data.start) > 3600)
          return endBreak(data.id)
      } else if (type === 3) {
        let curDate = new Date();
        if (
          curDate.getHours() === 6
          && curDate.getMinutes() === 0
          && curDate.getSeconds() === 0
        )
          return endBreak(data.id)
      }
      setBreakedTime(passedTime(data.start))
    }, 1000)
    
  }

  const endBreak = (_breakID = null) => {
    axios
      .put(
        proxy + `https://panel.staffmonitor.app/api/breaks/${_breakID ? _breakID : breakInfo.id}`,
        { end: Math.floor(Date.now() / 1000) }
      )
      .then(res => {
        
        setIsBreaking(false)
        setBreakedTime(0)
        clearInterval(breakTimer.current)
        sendDataToSubWindowBreakStatus(false)

      }).catch(err => {
        if (
          err
          && err.response
          && err.response.data
        ) {
          let errors = err.response.data;
          errors.length > 0
            && alert(errors[0].message)
        }
      })
  }


  const startButtonClicked = (project = null) => {
    if (isWorking) {
      endWork()
    } else {
      createSession(project)
    }
  }

  const createSession = async (project) => {

    try {
      setIsFetching(true)
      const response = await axios.get(proxy + "https://panel.staffmonitor.app/api/sessions?page=1&per-page=1", {
        params: {
          "per-page": 1,
          "sort": "-clockIn",
          "filter": { "clockOut": null }
        }
      })

      if (response.data.length > 0 && !response.data[0].clockOut) {

        startWork(response.data[0])
        dispatch(selectProject(response.data[0].project, true))

        const breaks = await axios.get(proxy + "https://panel.staffmonitor.app/api/breaks", {
          params: {
            "page": 1,
            "per-page": 20,
            "sort": "start",
            "filter": { "sessionId": response.data[0].id }
          }
        })

        if (breaks.data.length > 0) {
          const temp = breaks.data.find(item => item.end === null)
          if (temp) {
            startBreak(temp)
          }

        }

        getSummary()

      } else {

        const { rateCurrency } = await getProfile()

        const res = await axios.post(
          proxy + "https://panel.staffmonitor.app/api/sessions", {
          clockIn: Math.floor(Date.now() / 1000),
          projectId: project ? project.id : null,
          source: "desktop",
          rateCurrency
        })

        startWork(res.data)
      }

      setIsFetching(false)

    } catch (err) {

      setIsFetching(false)
      if (err && err.response && err.response.data) {
        let errors = err.response.data;
        errors.length > 0 && alert(errors[0].message)
      }
    }
  }

  const breakButtonClicked = (type) => {
    
    if (isBreaking) {
      endBreak()
    }
    else {
      axios
        .post(
          proxy + "https://panel.staffmonitor.app/api/breaks", {
          sessionId: workInfo.id,
          start: Math.floor(Date.now() / 1000)
        })
        .then(res => {
          startBreak(res.data, type)
        }).catch(err => {
          if (
            err
            && err.response
            && err.response.data
          ) {
            let errors = err.response.data;
            errors.length > 0
              && alert(errors[0].message)
          }
        })
    }
  }

  const sendDataToSubWindow = (data) => {
    window.electron.ipcRenderer.send("sendDataToSubWindow", data);
  }

  const sendDataToSubWindowBreakStatus = (data) => {
    window.electron.ipcRenderer.send("sendDataToSubWindowBreakStatus", data);
  }

  // iddle counter actions
  const wasBreaking = (start, end) => {
    axios.post(
      proxy + "https://panel.staffmonitor.app/api/breaks", {
      sessionId: workInfo.id,
      start: Math.floor(start),
      end: Math.floor(end)
    })
  }

  const notWorking = () => {
    startButtonClicked()
  }

  const getProfile = async () => {

    try {

      const res = await axios.get(proxy + "https://panel.staffmonitor.app/api/profile")
      return res.data

    } catch (error) {
      return { rateCurrency: "USD" }
    }

  }

  return (
    <>
      <header className="d-flex justify-content-between">
        <div className="player d-flex align-items-center">
          {!isFetching && 
            <Button variant="contained" className="icon-button play" onClick={() => startButtonClicked()}>
              {
                isWorking ? <StopIcon /> : <PlayArrowIcon />
              }
            </Button>
          }
          {
            isFetching &&
            <CircularProgress/>
          }
          {
            isWorking
            && isBreaking
            && <Button variant="contained" className={`icon-button stop active`} onClick={breakButtonClicked}>
              <PauseIcon />
            </Button>
          }
          {
            isWorking
            && !isBreaking
            && <div className="dropdown">
              <Button variant="contained" className={`icon-button stop`} id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                <PauseIcon />
              </Button>
              <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li className="pauseFor">Pause For<i className="fa-sharp fa-solid fa-angle-down"></i></li>
                <li><span className="dropdown-item" onClick={() => breakButtonClicked(1)}>15 Minutes</span></li>
                <li><span className="dropdown-item" onClick={() => breakButtonClicked(2)}>1 Hour</span></li>
                <li><span className="dropdown-item" onClick={() => breakButtonClicked(3)}>Until 6 am</span></li>
              </ul>
            </div>
          }
          <div className="p-details">
            <span className={`worktimer ${isWorking ? "active" : ""}`}>{formatTime(workedTime)}</span>
            {selectedProject && <span className='selectedProject'>{(`${cutProjectName(selectedProject.name)} assigned to current work time`)}</span>}
          </div>
          {isBreaking && <span className="breaktimer">(Break: {formatTime(breakedTime)})</span>}
        </div>
        <div className="others  d-flex align-items-center">
          <span className="summary">{`Today summary: ${formatTime(summary, "h:m")}`}</span>
          <a href='https://panel.staffmonitor.app/chat/index' target="__blank">
            <button className="chat">
              <i className="fa-regular fa-comments"></i>
            </button>
          </a>
        </div>
      </header>
      <MonitorModal
        isWorking={isWorking}
        isBreaking={isBreaking}
        wasBreaking={(start, end) => wasBreaking(start, end)}
        notWorking={notWorking}
        startBreak={breakButtonClicked}
        endBreak={() => endBreak()}
        endWork={() => endWork()}
      />
      <ReminderModal isWorking={isWorking} />
    </>
  );
};
export default Header;
