import React from "react"
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import useEffectOnce from "./useEffectOnce"
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import {
    useSelector,
    useDispatch
} from 'react-redux';

import { setReminderSettings } from "../actions/reminder"

export default function SettingModal({
    open,
    handleClose
}) {

    const dispatch = useDispatch()
    const reminder = useSelector(state => state.reminder)

    const {
        visibility,
        startup,
        isRemind,
        time_from,
        time_to,
        days,
        mins
    } = reminder;

    const weekDays = [
        { value: "M", key: 1 },
        { value: "T", key: 2 },
        { value: "W", key: 3 },
        { value: "T", key: 4 },
        { value: "F", key: 5 },
        { value: "S", key: 6 },
        { value: "S", key: 0 }
    ];

    useEffectOnce(() => {
        window.electron.ipcRenderer.send("getAppSettings")
        window.electron.ipcRenderer.once("appSettings", (event, result) => {
            if (result) {
                const data = JSON.parse(result)
                dispatch(setReminderSettings(data))
            }
        })
    }, [])

    const addDays = (value) => {
        let temp = [];
        if (days.indexOf(value) === -1)
            temp = [...days, value]
        else
            temp = days.filter(item => item !== value)

        dispatch(setReminderSettings({
            ...reminder,
            days: temp
        }))
    }

    const handleSave = () => {
        window.electron.ipcRenderer.send("saveAppSettings", reminder)
        handleClose()
    }

    const updateReminderSettings = (data) => {
        dispatch(setReminderSettings({
            ...reminder,
            ...data
        }))
    }

    return <Dialog
        open={open}
        onClose={handleClose}
        classes={{ root: "setting-modal" }}
    >
        <DialogContent classes={{ root: "sm-content" }}>
            <h1 className="option">- Activity Bar Visibility</h1>
            <div className="option-content">
                <RadioGroup
                    value={visibility}
                    onChange={(e) => updateReminderSettings({ visibility: e.target.value })}
                >
                    <FormControlLabel value={true} control={<Radio />} label="Enabled" />
                    <FormControlLabel value={false} control={<Radio />} label="Disabled" />
                </RadioGroup>
            </div>

            <h1 className="option">- Startup</h1>
            <div className="option-content">
                <RadioGroup
                    value={startup}
                    onChange={(e) => updateReminderSettings({ startup: e.target.value })}
                >
                    <FormControlLabel value={true} control={<Radio />} label="Enabled" />
                    <FormControlLabel value={false} control={<Radio />} label="Disabled" />
                </RadioGroup>
                <label className="desc">Stop application at main screen when computer starts</label>
            </div>
            <h1 className="option">- Reminders</h1>
            <FormControlLabel control={<Checkbox checked={isRemind} onChange={(e) => updateReminderSettings({ isRemind: e.target.checked })} />} label="Remind me to track time" />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="time-wrapper">
                    <TimePicker
                    disableOpenPicker={false}
                        label="From"
                        value={dayjs(time_from)}
                        onChange={(newValue) =>updateReminderSettings({ time_from: new Date(newValue) })}
                        renderInput={(params) => <TextField  {...params} />}
                        disabled={!isRemind}
              
                    />
                    <TimePicker
                        label="To"
                        value={dayjs(time_to)}
                        onChange={(newValue) => updateReminderSettings({ time_to: new Date(newValue) })}
                        renderInput={(params) => <TextField {...params} />}
                        disabled={!isRemind}
                    />
                </div>
            </LocalizationProvider>
            <div className="option-content indent-more">
                <div className="btn-groups">
                    {
                        weekDays.map((item, key) => {
                            return <Button
                                onClick={() => addDays(item.key)}
                                variant={days.indexOf(item.key) !== -1 ? "contained" : ""}
                                key={key}
                                disabled={!isRemind}
                            >
                                {item.value}
                            </Button>
                        })
                    }
                </div>
                <label className="desc">If I haven't tracked time in&nbsp;&nbsp;&nbsp;<TextField type="number" inputProps={{ step: 'any',min: 0, max: 999 }}  variant="standard" value={mins} onChange={(e) => updateReminderSettings({ mins: e.target.value })} disabled={!isRemind} className='mins' />&nbsp;&nbsp;&nbsp;mins</label>
            </div>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>CANCEL</Button>
            <Button onClick={handleSave}>SAVE</Button>
        </DialogActions>
    </Dialog>
}   