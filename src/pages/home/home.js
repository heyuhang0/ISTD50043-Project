import React from 'react';
import { withRouter } from 'react-router-dom';
import { Layout, Row, Col } from 'antd';
import NewBookCard from '../../components/NewBookCard/NewBookCard'
import GlobalFooter from '../../components/GlobalFooter/GlobalFooter'
import UserCard from '../../components/User/UserCard'
import BooksCard from './components/BooksCard/BooksCard'
import SearchBox from './components/SearchBox/SearchBox'
import './home.less';

const { Header, Content } = Layout;

class Home extends React.Component {
  render() {
    return (
      <Layout className="home">
        <Header className="home-header">
          <SearchBox history={this.props.history}/>
        </Header>
        <Content className="home-content">
          <Row className="cards-row">
            <Col xs={24} sm={24} md={12} lg={8}>
              <BooksCard title="Trending Books" url="/api/books/trending" />
            </Col>
            <Col xs={24} sm={24} md={12} lg={8}>
              <BooksCard title="Hot Books" url="/api/books/hot" />
            </Col>
            <Col xs={24} sm={24} md={12} lg={8}>
              <UserCard />
              <NewBookCard />
            </Col>
          </Row>
        </Content>
        <GlobalFooter />
      </Layout>
    );
  }
}

export default withRouter(Home);
