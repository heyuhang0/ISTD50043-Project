import React from 'react';
import { Card, Rate, Typography } from 'antd';
import axios from 'axios';
import './BookCard.less';

const { Paragraph } = Typography;

class BookCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      book: {},
      loading: true
    };
  }

  componentDidMount() {
    axios.get(this.props.url).then((res) => {
      console.log(res.data)
      this.setState({
        book: res.data.book,
        loading: false
      });
    });
  }

  render() {
    if (this.state.loading) {
      return <Card loading={true}></Card>;
    }

    const rating = this.state.book.rating_average;

    return (
      <div className="book-item">
        <Card className="book-card" title={this.props.title}>
          <div className="book-cover">
            <img src={this.state.book.imUrl} alt={this.state.book.title} />
          </div>
          <div className="book-info">
            <h1 className="title">{this.state.book.title}</h1>
            <p className="author">
              by <a href={"/search?q=" + escape(this.state.book.author)}>{this.state.book.author}</a>
            </p>
            <Rate
              allowHalf
              disabled
              defaultValue={rating}
            />
            <span className="rate-num">{this.state.book.rating_average.toFixed(1)}</span>
            <p className="rate-count">{this.state.book.review_number} reviews</p>
            <Paragraph
              className="description"
              ellipsis={{ rows: 8, expandable: true, symbol: 'more' }}>
              {this.state.book.description}
            </Paragraph>
          </div>
        </Card>

      </div>

    )
  }
}

export default BookCard;


