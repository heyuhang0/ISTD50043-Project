import React from 'react'
import { withRouter } from 'react-router-dom';
import { Layout, Row, Col, Card } from 'antd';
import queryString from 'query-string';
import BooksCard from './components/BooksCard/BooksCard';
import GlobalHeader from '../../components/GlobalHeader/GlobalHeader'
import GlobalFooter from '../../components/GlobalFooter/GlobalFooter'
import './search.less'

const Content = Layout;

class Search extends React.Component {
  render() {
    console.log(this.props.location);
    const params = queryString.parse(this.props.location.search);
    const keyword = unescape(params.q);
    console.log(keyword);
    return (
      <Layout className="search-results-page">
        <GlobalHeader reloadOnSearch defaultValue={keyword} />
        <Content className="search-results-content">
          <div className="results-col">
            <BooksCard url={`/api/books/search?q=${keyword}`} />
          </div>
        </Content>
        <GlobalFooter />
      </Layout>
    );
  }
}

export default withRouter(Search);
