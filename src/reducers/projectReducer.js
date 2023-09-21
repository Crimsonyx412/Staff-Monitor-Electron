import {
    GET_PROJECT_LIST,
    GET_PREFERED_LIST,
    SELECT_PROJECT,
    CHANGE_SESSION
} from "../actions/config"

const initialState = {
    curSession: null,
    selectedProject: null,
    list: [],
    preferedList: []

};

const changeNumReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_PROJECT_LIST:
            return {
                ...state,
                list: action.payload
            };
        case GET_PREFERED_LIST:
            return {
                ...state,
                preferedList: action.payload
            };
        case SELECT_PROJECT:
            if (Object.keys(action.payload).length === 1)
                return {
                    ...state,
                    selectedProject: null
                }
            if (state.selectedProject && (state.selectedProject.id === action.payload.id))
                return { ...state }
            return {
                ...state,
                selectedProject: action.payload
            };
        case CHANGE_SESSION:
            return {
                ...state,
                curSession: action.payload
            }
        default: return state
    }
}

export default changeNumReducer;