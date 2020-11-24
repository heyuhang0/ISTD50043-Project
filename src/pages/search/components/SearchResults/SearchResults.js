import React from 'react';
import { withRouter } from 'react-router-dom';
import { List, Rate, Button, Select } from 'antd';
import Icon from '@ant-design/icons';
import { DownOutlined } from '@ant-design/icons';
import axios from 'axios';
import NewBookCard from '../../../../components/NewBookCard/NewBookCard';
import { ReactComponent as SortSvg } from './assets/sort_icon.svg';
import './SearchResults.less';

const { Option } = Select;

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

class SearchResults extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      books: [],
      initLoading: true,
      loading: false,
      reachedEnd: false,
      offset: 0,
      sortKey: this.props.sortKey || "review_num_desc",
    };
  }

  onLoadMore = () => {
    this.setState({
      loading: true,
    });

    let queryUrl, queryParams = {};

    const categoryRe = /^category:\s?"(.*)"$/;
    if (categoryRe.test(this.props.keyword)) {
      const category = categoryRe.exec(this.props.keyword)[1];
      queryUrl = '/api/categories/' + escape(category);
    } else {
      queryUrl = '/api/books/search';
      queryParams.keyword = this.props.keyword;
    }

    if (this.state.sortKey) {
      queryParams.sort = this.state.sortKey;
    }

    axios.get(queryUrl, {
      params: {
        ...queryParams,
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
    const loadMore = !reachedEnd ? (
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
          icon={<DownOutlined height={20} />}
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
      <div>
        <Select
          className="sort-selector"
          defaultValue={this.state.sortKey}
          suffixIcon={<Icon component={SortSvg} />}
          onChange={sortKey => {
            if (sortKey === this.state.sortKey) {
              return;
            }
            this.props.history.push(`/search?q=${escape(this.props.keyword)}&sort=${escape(sortKey)}`);
            this.setState({
              books: [],
              initLoading: true,
              loading: false,
              reachedEnd: false,
              offset: 0,
              sortKey: sortKey,
            }, () => this.onLoadMore());
          }}
        >
          <Option value="review_num_desc">Most Commented</Option>
          <Option value="rating_desc">Top Rated</Option>
        </Select>
        <List
          className="search-results"
          dataSource={books}
          loading={initLoading}
          loadMore={!initLoading ? loadMore : null}
          renderItem={book => <BookItem book={book} />}
        />
      </div>
    )
  }
}

export default withRouter(SearchResults);

