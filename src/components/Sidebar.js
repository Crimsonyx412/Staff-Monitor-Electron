import React from 'react';
import SettingModal from "./settings"
import { useSelector, useDispatch } from "react-redux"
import { openReminderSettingModal } from "../actions/reminder"

const Sidebar = () => {

    const dispatch = useDispatch()
    const isOpen = useSelector(state => state.reminder.rsModalOpen)

    const handleOpenSettingModal = () => {
        dispatch(openReminderSettingModal(true))
    }

    const handleCloseSettingModal = () => {
        dispatch(openReminderSettingModal(false))
    }

    return (
        <>
            <aside className="sidebar">
                <div className="logo-wrapper">
                    <img
                        className="logo"
                        src="assets/imgs/logo_Staff.svg"
                        alt="logo"
                    />
                </div>
                <ul className="navbar d-flex flex-column">
                    <li className="item">
                        <a href='https://panel.staffmonitor.app/clock/history' target="__blank">
                            <i className="fa-solid fa-rectangle-list"></i>
                        </a>
                    </li>
                    <li className="item ">
                        <a href='https://panel.staffmonitor.app/task/index' target="__blank">
                            <i className="fa-solid fa-clipboard-check"></i>
                        </a>
                    </li>
                    <li className="item">
                        <a href='https://panel.staffmonitor.app/clock/calendar' target="__blank">
                            <i className="fa-solid fa-calendar-days"></i>
                        </a>
                    </li>
                    <li
                        className="item"
                        onClick={handleOpenSettingModal}
                    >
                        <i className="fa-sharp fa-solid fa-gear"></i>
                    </li>
                </ul>
            </aside>
            {
                <SettingModal
                    open={isOpen}
                    handleClose={handleCloseSettingModal}
                />
            }
        </>
    );
};
export default Sidebar;
