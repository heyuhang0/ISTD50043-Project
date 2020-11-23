import React from 'react';
import { Layout, Row, Col, Card } from 'antd';
import { useParams, withRouter } from 'react-router-dom'
import BookCard from './components/BookCard/BookCard'
import './book.less';
import ReviewComment from './components/ReviewBox/ReviewComment';
import AddReview from './components/AddReview/AddReview';
import RecommendationCard from './components/RecommendationCard/RecommendationCard';
import GlobalFooter from '../../components/GlobalFooter/GlobalFooter'

const Content = Layout;

function Book(props) {
  let { asin } = useParams();
  console.log(props)
  return (
    <Layout className="book">
      {/* <h1>Book Page for Book {asin}</h1> */}
      <Content className="book-content">
        <Row className="book-row">
          <Col span={17}>
            <BookCard url={`/api/books/${asin}`} />
            {/* <Card title="Start your review here">
              <AddReview title="Start your review" asin={`${asin}`} />
            </Card> */}
            <Card title="Community Reviews">
              <ReviewComment url={`/api/books/${asin}/reviews`} perPage={10} />
            </Card>
          </Col>
          <Col span={7}>
            <RecommendationCard title="People also viewed" url={`/api/books/${asin}`} />
          </Col>
        </Row>
      </Content>
      <GlobalFooter />
    </Layout>
  );
}




export default withRouter(Book);
