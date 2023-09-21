import React from "react"
import {
    Navigate,
    Outlet,
} from 'react-router-dom';
import { useAuth } from "../hooks/useAuth"

const PrivateRoute = ({
    redirectPath = '/landing',
    children,
}) => {
    const auth = useAuth();
    const { user } = auth;
    if (!user.isAuth) {
        return <Navigate to={redirectPath} replace />;
    }

    return children ? children : <Outlet />;
}

export default PrivateRoute
