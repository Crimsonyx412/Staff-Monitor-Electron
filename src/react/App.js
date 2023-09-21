import React from 'react';
import {
  HashRouter as Router,
  Route,
  Routes
} from 'react-router-dom';
import {
  createTheme,
  ThemeProvider
} from '@mui/material/styles';

import ActionsProvider from "../ActionsProvider"
import { AuthProvider } from '../contexts/AuthContext'

import Login from '../pages/Login';
import Home from '../pages/Home';
import Notfound from '../pages/Notfound';

import ActivityBar from "../components/ActivityBar"
import Layout from '../components/Layout';
import PrivateRoute from "../components/PrivateRoute"

import "bootstrap";
 
const theme = createTheme({
  status: {
    danger: '#e53e3e',
  },
  palette: {
    primary: {
      main: '#007bff',
      darker: '#161726',
      lighter: "#D0D0D0"
    }
  },
});


const App = () => {

  return (
    
    <Router>
      <AuthProvider>
        <ActionsProvider>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route exact path="/login" element={<Login />} />

              <Route exact path="/activity" element={
                <PrivateRoute
                  redirectPath="/login"
                >
                  <ActivityBar />
                </PrivateRoute>
              } />

              <Route exact path="/" element={
                <PrivateRoute
                  redirectPath="/login"
                >
                  <Layout>
                    <Home />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="*" element={
                <PrivateRoute
                  redirectPath="/login"
                >
                  <Layout>
                    <Notfound />
                  </Layout>
                </PrivateRoute>
              } />
            </Routes >
          </ThemeProvider>
        </ActionsProvider>
      </AuthProvider>
    </Router>

  );
}

export default App;