import React from 'react'
import { withRouter } from 'react-router-dom';
import queryString from 'query-string';
import BooksCard from './components/BooksCard/BooksCard';

class Search extends React.Component {
  render() {
    const params = queryString.parse(this.props.location.search);
    return (
      <div>
        <h1>Search result for {params.q} </h1>
        {/* <BooksCard title="Search results" url={`/api/search?q=${params.q}`} /> */}
        <BooksCard title="Search results" url={`/api/books/search?q=${params.q}`} />
      </div>
    );
  }
}

export default withRouter(Search);
