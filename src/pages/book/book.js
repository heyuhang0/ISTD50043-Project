import React from 'react';
import { Layout, Row, Col } from 'antd';
import { useParams, withRouter } from 'react-router-dom'
import BookCard from './components/BookCard/BookCard'
import './book.less';
import ReviewComment from './components/ReviewBox/ReviewComment';
import AddReview from './components/AddReview/AddReview';
import RecommendationCard from './components/RecommendationCard/RecommendationCard';

const Content = Layout;

function Book(props){
  const { asin } = useParams();
  return ( 
      <Layout className="book">
        {/* <h1>Book Page for Book {asin}</h1> */}
        <Content className="book-content">
          <Row className="book-row">
            <Col xs={16} sm={16} md={16} lg={16}>
              <BookCard url="/api/books/B00A287PG2"/>
              <h3>Start your review of To Kill a Mockingbird"</h3>
              <AddReview title="Start your review of To Kill a Mockingbird" url="/api/books/B00A287PG2/addreview"/>
              <h3>Community Reviews</h3>
              <ReviewComment title="Community Reviews" url="/api/books/B00A287PG2/reviews"/>
            </Col>
            <Col xs={8} sm={8} md={8} lg={8}>
              <RecommendationCard title="People also viewed" url="/api/books/B00A287PG2/recommendations"/>
            </Col>
          </Row>
        </Content>
      </Layout>
  );
}




export default withRouter(Book);
