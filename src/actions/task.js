import axios from "axios";
import {
    proxy,
    GET_TASK_LIST
} from "./config"

export const getTaskList = (category) => dispatch => {

    let filters = {}
    if (category === "Previous") {
        let start = new Date();
        start.setHours(0, 0, 0, 0);
        filters = {
            "page": 1,
            "per-page": 30,
            "sort": "-start",
            "filter": {
                'start': {
                    'lt': Math.floor(start / 1000)
                }
            }
        }
    } else if (category === "Today") {

        let start = new Date(), end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        filters = {
            "page": 1,
            "per-page": 30,
            "sort": "start, status",
            "filter": {
                'start': {
                    'gte': Math.floor(start / 1000), 'lt': Math.floor(end / 1000)
                }
            }
        }

    } else if (category === "Incoming") {

        let end = new Date();
        end.setHours(23, 59, 59, 999);

        filters = {
            "page": 1,
            "per-page": 30,
            "sort": "start",
            "filter": {
                'start': {
                    'gte': Math.floor(end / 1000)
                }
            }
        }
    }
    axios
        .get(proxy + "https://panel.staffmonitor.app/api/tasks?page=1&per-page=30", {
            params: filters
        })
        .then(res => {
            dispatch({
                type: GET_TASK_LIST,
                payload: res.data
            })
        }).catch((err) => {
            console.log(err)
            // dispatch({
            //     type: GET_TASK_LIST,
            //     payload: []
            // })
        })
}
