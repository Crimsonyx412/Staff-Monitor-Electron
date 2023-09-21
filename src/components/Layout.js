import React from "react"
import Header from "./Header";
import Sidebar from "./Sidebar";

const Layout = (props) => {
    return (
        <>
            <Header />
            <Sidebar />
            {props.children}
        </>
    )
}

export default Layout;