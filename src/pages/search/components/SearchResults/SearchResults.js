import React from 'react';
import { List, Rate } from 'antd';
import axios from 'axios';
import './SearchResults.less';


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
            loading: true
        };
    }

    componentDidMount() {
        axios.get('/api/books/search', {
            params: {
                keyword: this.props.keyword,
                limit: 0,
                offset: 0
            }
        }).then((res) => {
            this.setState({
                books: res.data.books,
                loading: false
            });
        });
    }

    render() {
        return (
            <List
                className="search-results"
                dataSource={this.state.books}
                loading={this.state.loading}
                renderItem={book => <BookItem book={book} />}
            />
        )
    }
}

export default BooksCard;

