import {
    SET_REMINDER_SETTINGS,
    OPEN_REMINDER_SETTING_MODAL
} from "../actions/config"

const initialState = {
    rsModalOpen: false,
    visibility: true,
    startup: true,
    isRemind: true,
    time_from: '2014-08-18T00:00:00',
    time_to: '2014-08-18T00:15:00',
    days: ["monday", 'tuesday', 'wednesday', 'thursday', 'friday'],
    mins: 30
};

const changeNumReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_REMINDER_SETTINGS:
            return {
                ...state,
                visibility: action.payload.visibility,
                startup: action.payload.startup,
                isRemind: action.payload.isRemind,
                time_from: action.payload.time_from,
                time_to: action.payload.time_to,
                days: action.payload.days,
                mins: action.payload.mins,
            }
        case OPEN_REMINDER_SETTING_MODAL:
            return {
                ...state,
                rsModalOpen: action.payload
            }
        default: return state
    }
}

export default changeNumReducer;