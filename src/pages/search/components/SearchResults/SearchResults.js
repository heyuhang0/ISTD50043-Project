import React from 'react';
import { List, Rate, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import axios from 'axios';
import './SearchResults.less';
import NewBookCard from '../../../../components/NewBookCard/NewBookCard'


function BookItem(props) {
  return (
    <List.Item>
      <div className="book-item">
        <div className="book-cover">
          <a href={"/book/" + escape(props.book.asin)}>
            <img src={props.book.imUrl} alt={props.book.title} />
          </a>
        </div>
        <div className="book-content">
          <a className="title" href={"/book/" + escape(props.book.asin)}>
            <h3>{props.book.title}</h3>
          </a>
          <p className="author">
            by <a href={"/search?q=" + escape(props.book.author)}>{props.book.author}</a>
          </p>
          <Rate
            allowHalf
            disabled
            defaultValue={props.book.rating_average}
          />
          <span className="rate-num">{props.book.rating_average.toFixed(1)}</span>
          <p className="rate-count">{props.book.review_number} reviews</p>
        </div>
      </div>
    </List.Item>
  );
}

class BooksCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      books: [],
      initLoading: true,
      loading: false,
      reachedEnd: false,
      offset: 0,
    };
  }

  onLoadMore = () => {
    this.setState({
      loading: true,
    });
    axios.get('/api/books/search', {
      params: {
        keyword: this.props.keyword,
        limit: this.props.perPage,
        offset: this.state.offset,
      }
    }).then(res => {
      const resLength = res.data.books.length;
      const books = this.state.books.concat(res.data.books);
      this.setState({
        books: books,
        offset: this.state.offset + resLength,
        reachedEnd: resLength < this.props.perPage,
        loading: false,
        initLoading: false,
      });
    });
  };

  componentDidMount() {
    this.onLoadMore();
  }

  render() {
    const { initLoading, loading, books, reachedEnd } = this.state;
    const loadMore =
      !initLoading && !reachedEnd ? (
        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            height: 32,
            lineHeight: '32px',
          }}
        >
          <Button
            onClick={this.onLoadMore}
            loading={loading}
            shape="round"
            icon={<DownOutlined />}
            size="large"
          >
            View more
          </Button>
        </div>
      ) : (
          <div style={{ marginTop: 12 }}>
            <NewBookCard />
          </div>
        );

    return (
      <List
        className="search-results"
        dataSource={books}
        loading={initLoading}
        loadMore={loadMore}
        renderItem={book => <BookItem book={book} />}
      />
    )
  }
}

export default BooksCard;

