import React from 'react'
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';

class Search extends React.Component {
  render() {
    const params = queryString.parse(this.props.location.search);
    return <h1>Search result for {params.q} </h1>;
  }
}

export default withRouter(Search);
