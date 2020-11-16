import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import axios from 'axios';
import Loading from './components/Loading/Loading';

if (window.localStorage.token) {
  axios.defaults.headers.common['Authorization'] =
    'Bearer ' + window.localStorage.token;
}

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
