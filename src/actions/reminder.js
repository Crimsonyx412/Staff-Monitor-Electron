import {
    SET_REMINDER_SETTINGS,
    OPEN_REMINDER_SETTING_MODAL
} from "./config"

export const setReminderSettings = (settings) => {
    return {
        type: SET_REMINDER_SETTINGS,
        payload: settings
    }
}

export const openReminderSettingModal = (open) => {
    return {
        type: OPEN_REMINDER_SETTING_MODAL,
        payload: open
    }
}