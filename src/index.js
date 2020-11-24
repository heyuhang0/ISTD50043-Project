import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import axios from 'axios';
import Loading from './components/Loading/Loading';

axios.interceptors.request.use(function (config) {
  const token = window.localStorage.token;
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

const Home = lazy(() => import('./pages/home/home'));
const Search = lazy(() => import('./pages/search/search'));
const Book = lazy(() => import('./pages/book/book'));


ReactDOM.render((
  <Router>
    <Suspense fallback={<Loading />}>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/book/:asin" component={Book} />
      </Switch>
    </Suspense>
  </Router>
), document.getElementById('root'))
