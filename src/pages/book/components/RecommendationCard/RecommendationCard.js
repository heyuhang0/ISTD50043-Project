import React from 'react';
import { Card, List, Rate } from 'antd';
import axios from 'axios';
import './RecommendationCard.less'
import '../BookCard/BookCard'


function BookItem(props) {
  // const book = props.book;
  // const related_books_asin = book.related;
  return (
    <List.Item>
      <div className="book-item">
        <div className="book-cover">
          <a href={"/book/" + escape(props.book.asin)}>
            <img src={props.book.imUrl} alt={props.book.title} />
          </a>
        </div>
        <div className="book-info">
          <a className="title" href={"/book/" + escape(props.book.asin)}>
            <h4>{props.book.title}</h4>
          </a>
          <p className="author">
            by <a href={"/search?q=" + escape(props.book.author)}>{props.book.author}</a>
          </p>
          <Rate
            allowHalf
            disabled
            defaultValue={props.book.rating_average}
          />
          <span className="rate-num"> {props.book.rating_average.toFixed(1)}</span>
        </div>
      </div>
    </List.Item>
  );
}

class RecommendationCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      books: [],
      loading: true
    };
  }

  componentDidMount() {
    axios.get(this.props.url).then((res) => {
      this.setState({
        books: res.data.related,
        loading: false
      });
    });
  }

  render() {
    return (
      <Card className="recommendations-card" title={this.props.title}>
        <List
          dataSource={this.state.books}
          loading={this.state.loading}
          renderItem={book => <BookItem book={book} />}
        />
      </Card>
    )
  }
}

export default RecommendationCard;