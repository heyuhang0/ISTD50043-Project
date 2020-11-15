import React from 'react';
import { Card, Rate } from 'antd';
import axios from 'axios';
import './BookCard.less';


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
        book: res.data,
        loading: false
      });
    });
  }

  render() {
    if (this.state.loading) {
      return <div></div>
    }
    // console.log("testing")
    // console.log(this.state.book)
    // console.log(typeof(this.state.book))
    // console.log(this.state.book.rating)
    // console.log(JSON.stringify(this.state.book.rating))
    // console.log(2)
    // console.log(typeof(2))
    // console.log(Number(this.state.book.rating))
    // console.log(typeof(Number(this.state.book.rating)))
    const rating = this.state.book.rating_average
    // console.log(typeof (rating))
    // console.log(rating)

    return (
      <div className="book-item">
        <Card className="book-card" title={this.props.title}>
          <div className="book-cover">
            <img src={this.state.book.imUrl} alt={this.state.book.title} />
          </div>
          <div className="book-content">
            <a className="title" href={"/book/" + escape(this.state.book.asin)}>
              <h4>{this.state.book.title}</h4>
            </a>
            <p className="author">
              by <a href={"/search?q=" + escape(this.state.book.author)}>{this.state.book.author}</a>
            </p>
            <Rate
              allowHalf
              disabled
              defaultValue={rating}
            />
            <span className="rate-num"> {this.state.book.rating_average}</span>
            <p className="ratecount"> {this.state.book.rating_total} reviews</p>
            <p className="decription">
              Description: {this.state.book.description}
            </p>

          </div>
        </Card>

      </div>

    )
  }
}

export default BookCard;


