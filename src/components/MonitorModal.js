import React, {
    useRef,
    useState,
    useEffect
} from "react"

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { formatTime } from "../module";

export default function MonitorModal({
    isWorking,
    isBreaking,
    wasBreaking,
    startBreak,
    notWorking,
    endBreak,
    endWork
}) {

    const workingTimer = useRef(null);
    const modalTimer = useRef(null);
    const [open, setOpen] = useState(false);
    const [countdown, setCountdown] = useState(60)

    const [lastModal, setLastModal] = useState(false)
    const [breakcount, setBreakCount] = useState(0)
    const [breakModal, setBreakModal] = useState(false)
    const breakTimer = useRef(null);

    useEffect(() => {
        const clearEvent = (event, data) => {
            if (
                !open
                && isWorking
                && !isBreaking
            ) {
                clearTimeout(workingTimer.current)
                monitorWorking()
            }
        }

        window.electron.ipcRenderer.on("keydown", clearEvent)
        window.electron.ipcRenderer.on("mouseclick", clearEvent)

        return () => {
            window.electron.ipcRenderer.off("mouseclick", clearEvent)
            window.electron.ipcRenderer.off("keydown", clearEvent)
        }
    }, [open, isWorking, isBreaking])

    useEffect(() => {
        if (isWorking && !isBreaking) {
            clearTimeout(workingTimer.current)
            monitorWorking()
        }
        else {
            clearTimeout(workingTimer.current)
        }
    }, [isWorking, isBreaking])

    useEffect(() => {
        if (countdown < 1) {
            openBreakModal()
            handleClose()
        }
    }, [countdown])

    useEffect(() => {
        if (breakcount > 1800) {
            setLastModal(true)
            stopWork()
        }
    }, [breakcount])
    const openBreakModal = () => {
        setBreakModal(true)
        startBreak()
        breakTimer.current = setInterval(() => {
            setBreakCount(prev => prev + 1)
        }, 1000)
    }

    const breakModalClose = () => {
        setBreakModal(false)
        clearInterval(breakTimer.current)
        setBreakCount(0)
    }

    // this function sets the timer that logs out the user after 10 secs
    const monitorWorking = () => {
        workingTimer.current = setTimeout(() => {
            window.electron.ipcRenderer.send("showMainWindow");
            setOpen(true)
            modalTimer.current = setInterval(() => {
                setCountdown(prev => prev - 1)
            }, 1000)
            }, 300000)
        // }, 5000) // test
    };

    const handleClose = () => {
        setOpen(false)
        clearInterval(modalTimer.current)
        setCountdown(60)
    }

    const handleWasBreak = () => {
        let end = Date.now() / 1000;
        let start = end - 300 - (60 - countdown);
        wasBreaking(start, end)
        handleClose()
    }

    const handleNotWorking = () => {
        notWorking()
        handleClose()
    }

    const handleWorking = () => {
        handleClose()
    }

    const finishBreak = () => {
        breakModalClose()
        endBreak()
    }
    const stopWork = () => {
        breakModalClose()
        endWork()
    }
    return <>
        <Dialog
            open={open}
            onClose={handleClose}
            classes={{ root: "monitor-modal-wrapper" }}

        >
            <DialogContent classes={{ root: "mm-content" }}>
                <h2>Hi. It seems kind of quiet. Are you still working?</h2>
                <p>Clicking or typing anywhere means you're working</p>
                <div className="count-down">
                    <CircularProgress disableShrink className="circular" value={20} />
                    <h1 className="time">{countdown}</h1>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleWasBreak}>I was at break</Button>
                <Button onClick={handleNotWorking}>Not working</Button>
                <Button onClick={handleWorking}>Working</Button>
            </DialogActions>
        </Dialog>
        <Dialog
            open={breakModal}
            onClose={breakModalClose}
            classes={{ root: "break-modal-wrapper" }}
        >
            <DialogContent classes={{ root: "mm-content" }}>
                <h5>Break has been started because of inactivity</h5>
                <p>Break time:{formatTime(breakcount)}</p>
            </DialogContent>
            <DialogActions>
                <Button onClick={finishBreak}>Finish Break</Button>
                <Button onClick={stopWork}>Stop Work</Button>
            </DialogActions>
        </Dialog>
        <Dialog
            open={lastModal}
            onClose={() => setLastModal(false)}
            classes={{ root: "break-modal-wrapper" }}
        >
            <DialogContent classes={{ root: "mm-content" }}>
                Work time has been stopped due to inactivity
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setLastModal(false)}>Dismiss</Button>
            </DialogActions>
        </Dialog>
    </>
}