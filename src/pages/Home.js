import React, {
    useEffect,
    useState,
    useRef
} from 'react';

import {
    useSelector,
    useDispatch
} from 'react-redux';

import {
    getProjectList,
    getPreferredProjects,
    selectProject,
    updatePreferredProjects
} from "../actions/project"

import { getTaskList } from "../actions/task"
import useEffectOnce from "../components/useEffectOnce"

const Home = () => {

    // redux
    const selectedProject = useSelector((state) => state.project.selectedProject);
    const projectList = useSelector((state) => state.project.list);
    const preferedList = useSelector((state) => state.project.preferedList)
    const taskList = useSelector((state) => state.task.list);
    const dispatch = useDispatch();
    // states
    const [category, setCategory] = useState("Today")
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [keyword, setKeyword] = useState("")
    const timer = useRef(null)

    useEffectOnce(() => {
        
        dispatch(getProjectList())
        dispatch(getPreferredProjects())

        // reload tasks and project in every 3 mins
        timer.current = setInterval(() => {

            dispatch(getTaskList(category))
            dispatch(getProjectList())

        }, 1000 * 180)

        window.electron.ipcRenderer.on('refreshtoken_on_resume', async (event, result) => {
            
            dispatch(getTaskList(category))
            dispatch(getProjectList())

        })

        return () => {
            clearInterval(timer.current)
        }

    }, [])

    useEffect(() => {
        dispatch(getTaskList(category))
    }, [category])

    useEffect(() => {
        let temp = [];
        // sort project by prefered project
        temp = projectList
            .map((item) => {
                if (preferedList.indexOf(item.id) !== -1)
                    return { ...item, prefered: true }
                else
                    return { ...item, prefered: false }
            })
        temp.sort((a, b) => b.prefered - a.prefered)
        // filter project by keyword.
        if (keyword !== "")
            temp = temp.filter(item => item.name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1)
        // temp = temp.filter((item, key) => key < 8) 
        setFilteredProjects(temp)

        // if (temp.length === 0)
        //     dispatch(getProjectList())
    }, [keyword, preferedList, projectList])

    const changeRate = (id) => {
        let temp = preferedList.slice()
        let idx = temp.indexOf(id)
        if (idx === -1)
            temp.push(id);
        else
            temp.splice(idx, 1)
        dispatch(updatePreferredProjects(temp))
    }

    return (
        <main>
            <div className="page-content row">
                <div className="tb-content col-md-6">
                    <h5>Projects</h5>
                    <div className="search">
                        <input
                            className="form-control"
                            type="search"
                            placeholder="search..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </div>
                    <div className="divider"></div>
                    {
                        filteredProjects.length > 0
                            ? <div className="item-list">
                                {
                                    filteredProjects
                                        .map((project, key) => {
                                            return (
                                                <div className="item-wrapper" key={key}>
                                                    <button
                                                        className="star"
                                                        onClick={() => changeRate(project.id)}
                                                    >
                                                        <i className={project.prefered ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                                                    </button>
                                                    <div
                                                        className={`item ${selectedProject && selectedProject.id === project.id ? "highlight" : ""}`}
                                                        onClick={() => dispatch(selectProject(project))}
                                                        dangerouslySetInnerHTML={{ __html: project.name }}
                                                    ></div>
                                                </div>
                                            )
                                        })
                                }
                            </div> : <h1 className="no-data">No assigned projects</h1>
                    }
                </div>
                <div className="tb-content col-md-6">
                    <h5>Tasks</h5>
                    <div className="actions">
                        <button className={`category ${category === "Previous" ? "active" : ""}`} onClick={() => setCategory("Previous")}>Previous</button>
                        <button className={`category ${category === "Today" ? "active" : ""}`} onClick={() => setCategory("Today")}>Today</button>
                        <button className={`category ${category === "Incoming" ? "active" : ""}`} onClick={() => setCategory("Incoming")}>Incoming</button>
                    </div>
                    <div className="divider"></div>
                    {
                        taskList.length > 0
                            ? <div className="item-list">
                                {
                                    taskList.map((item, key) => {
                                        return <div className="item-wrapper" key={key}>
                                            <div className="item" style={{ textDecoration: item.status === 1 ? "line-through" : "unset" }}>{item.title}</div>
                                            <a className="search_button" href={`https://panel.staffmonitor.app/task/edit/${item.id}`} target="__blank"><i className="fa-solid fa-magnifying-glass"></i></a>
                                        </div>
                                    })
                                }
                            </div> : <h1 className="no-data">No tasks</h1>
                    }
                </div>
            </div>
        </main >
    );
};
export default Home;
