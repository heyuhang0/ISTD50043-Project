import React from 'react';
import { Layout, Row, Col, Card } from 'antd';
import { useParams, withRouter } from 'react-router-dom'
import BookCard from './components/BookCard/BookCard'
import './book.less';
import ReviewComment from './components/ReviewBox/ReviewComment';
import AddReview from './components/AddReview/AddReview';
import RecommendationCard from './components/RecommendationCard/RecommendationCard';

const Content = Layout;

function Book(props) {
  let { asin } = useParams();
  console.log(props)
  return (
    <Layout className="book">
      {/* <h1>Book Page for Book {asin}</h1> */}
      <Content className="book-content">
        <Row className="book-row">
          <Col xs={16} sm={16} md={16} lg={16}>
            <BookCard url={`/api/books/${asin}`} />
            <Card title="Start your review here">
              <AddReview title="Start your review" asin={`${asin}`} />
            </Card>
            <Card title="Community Reviews">
              <ReviewComment url={`/api/books/${asin}/reviews`} />
            </Card>
          </Col>
          <Col xs={8} sm={8} md={8} lg={8}>
            <RecommendationCard title="People also viewed" url={`/api/books/${asin}`} />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}




export default withRouter(Book);
