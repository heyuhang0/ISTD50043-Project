import React from 'react'
import { withRouter } from 'react-router-dom';
import { Layout } from 'antd';
import queryString from 'query-string';
import SearchResults from './components/SearchResults/SearchResults';
import GlobalHeader from '../../components/GlobalHeader/GlobalHeader'
import GlobalFooter from '../../components/GlobalFooter/GlobalFooter'
import './search.less'

const Content = Layout;

class Search extends React.Component {
  render() {
    const params = queryString.parse(this.props.location.search);
    const keyword = unescape(params.q);
    const sortKey = params.sort ? unescape(params.sort) : null;
    return (
      <Layout className="search-results-page">
        <GlobalHeader reloadOnSearch defaultValue={keyword} />
        <Content className="search-results-content">
          <div className="results-col">
            <SearchResults keyword={keyword} sortKey={sortKey} perPage={15} />
          </div>
        </Content>
        <GlobalFooter />
      </Layout>
    );
  }
}

export default withRouter(Search);
