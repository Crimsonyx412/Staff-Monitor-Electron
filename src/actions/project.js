import axios from "axios";
import {
    proxy,
    GET_PROJECT_LIST,
    GET_PREFERED_LIST,
    SELECT_PROJECT,
    CHANGE_SESSION
} from "./config"

export const selectProject = (selectedProject, notInit = false) => {
    return {
        type: SELECT_PROJECT,
        payload: {
            ...selectedProject,
            notInit
        }
    }
}

export const changeSession = (session) => {
    return {
        type: CHANGE_SESSION,
        payload: session
    }
}

export const getProjectList = () => async (dispatch) => {
    const func = (page) => {
        return new Promise((resolve, reject) => {
            axios
                .get(proxy + "https://panel.staffmonitor.app/api/projects", {
                    params: {
                        "page": page,
                        "per-page": 100,
                        "sort": "-start",
                        // "filter": { 'start': { 'gte': Math.floor(Date.now() / 1000), 'lt': Math.floor(Date.now() / 1000) } }
                    }
                })
                .then(res => {
                    resolve(res.data)
                }).catch((err) => {
                    console.log(err)
                    reject([])
                })
        })
    }

    let data = [];
    for (let i = 0; i < 1000; i++) {
        let temp = await func(i + 1);
        if (temp.length > 0)
            data = data.concat(temp)
        else
            break;
    }

    dispatch({
        type: GET_PROJECT_LIST,
        payload: data
    })
}

export const getPreferredProjects = () => dispatch => {
    axios
        .get(proxy + "https://panel.staffmonitor.app/api/profile")
        .then(res => {
            dispatch({
                type: GET_PREFERED_LIST,
                payload: res.data.preferredProjects
            })
        }).catch((err) => {
            dispatch({
                type: GET_PREFERED_LIST,
                payload: []
            })
        })
}

export const updatePreferredProjects = (prefered) => dispatch => {
    axios
        .put(
            proxy + "https://panel.staffmonitor.app/api/profile",
            { preferredProjects: prefered }
        )
        .then(res => {
            dispatch({
                type: GET_PREFERED_LIST,
                payload: res.data.preferredProjects
            })

        }).catch(err => {
            if (
                err
                && err.response
                && err.response.data
            ) {
                let errors = err.response.data;
                errors.length > 0 && errors.forEach(item => {
                    alert(item.message)
                })
            }
        })
}