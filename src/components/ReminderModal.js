import React, {
    useRef,
    useState,
    useEffect,
} from "react"
import {
    useSelector,
    useDispatch
} from "react-redux"

import CloseIcon from '@mui/icons-material/Close';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';

import { openReminderSettingModal } from "../actions/reminder"

export default function ReminderModal({ isWorking }) {

    const timerId = useRef(null)

    const dispatch = useDispatch()
    const reminder = useSelector(state => state.reminder)

    const [isOpen, setOpen] = useState(false)
    const [timer, setTimer] = useState(0)

    const {
        isRemind,
        time_from,
        time_to,
        days,
        mins
    } = reminder;

    useEffect(() => {
        if (!isWorking) {
            timerId.current = setInterval(() => {
                setTimer(prev => prev + 1)
            }, 1000)
        } else {
            setOpen(false)
        }
        return () => {
            setTimer(0)
            clearInterval(timerId.current)
            timerId.current = null
        }
    }, [isWorking])

    useEffect(() => {
        let startTime = new Date(time_from),
            endTime = new Date(time_to),
            curTime = new Date(),
            curDay = curTime.getDay()

        startTime = startTime.getHours() * 3600 + startTime.getMinutes() * 60;
        endTime = endTime.getHours() * 3600 + endTime.getMinutes() * 60;
        curTime = curTime.getHours() * 3600 + curTime.getMinutes() * 60;

        if (
            timer > mins * 60
            && isRemind
            && (endTime >= curTime && curTime >= startTime && days.indexOf(curDay) !== -1)
        ) {
            window.electron.ipcRenderer.send("showMainWindow")
            setOpen(true)
            setTimer(0)
        }
    }, [timer])

    const handleCloseModal = () => {
        setOpen(false)
        setTimer(0)
    }

    return <div className={`reminder-modal ${isOpen ? "show" : ""}`}>
        <CircleNotificationsIcon />
        <h1>Ready to continue?</h1>
        <p>You can <label onClick={() => dispatch(openReminderSettingModal(true))}>adjust reminder settings</label>.</p>
        <CloseIcon onClick={handleCloseModal} className="close-icon" />
    </div>
}