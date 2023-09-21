import {
    GET_TASK_LIST
} from "../actions/config"

const initialState = {
    list: []

};

const changeNumReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_TASK_LIST:
            return {
                ...state,
                list: action.payload
            };
        default: return state
    }
}

export default changeNumReducer;