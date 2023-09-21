import { combineReducers } from "redux";
import projectReducer from "./projectReducer";
import taskReducer from "./taskReducer"
import reminderReducer from "./reminderReducer"

const rootReducer = combineReducers({
    project: projectReducer,
    task: taskReducer,
    reminder: reminderReducer
})

export default rootReducer;