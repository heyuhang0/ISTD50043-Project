import React, { createElement, useState } from 'react';
import { Comment, Tooltip, List, Rate, Typography, Button, Select } from 'antd';
import { LikeFilled, LikeOutlined, DownOutlined } from '@ant-design/icons';
import Icon from '@ant-design/icons';
import axios from 'axios';
import UserAvatar from '../UserAvatar/UserAvatar';
import { ReactComponent as SortSvg } from './assets/sort_icon.svg';
import './ReviewComment.less';

const { Paragraph } = Typography;
const {Option} = Select;

function ReviewItem(props) {
  const [likes, setLikes] = useState(props.review.helpful);
  const [action, setAction] = useState(null);

  const like = () => {
    if (action !== 'liked') {
      axios
        .post(`/api/books/${props.review.asin}/reviews/${props.review.reviewId}/upvote`,
          {
            reviewid: props.review.reviewId
          }
        )
        .catch(err =>
          console.log(err))

      setLikes(likes + 1);
      setAction('liked');
    }
  };

  const actions = [
    <Tooltip key="comment-basic-like" title="Like">
      <span onClick={like}>
        {createElement(action === 'liked' ? LikeFilled : LikeOutlined)}
        <span className="comment-action">{likes}
        </span>
      </span>
    </Tooltip>

  ];

  return (
    <List.Item>
      <Comment
        className="review-comment-item"
        actions={actions}
        author={props.review.user.name}
        avatar={<UserAvatar username={props.review.user.name} />}
        datetime={props.review.createdAt.substring(0, 10)}
        content={
          <div>
            <Rate
              allowHalf
              disabled
              defaultValue={props.review.rating}
            />
            <h3>{props.review.summary}</h3>
            <Paragraph ellipsis={{ rows: 5, expandable: true, symbol: 'more' }}>
              {props.review.reviewText}
            </Paragraph>
          </div>
        }
      />
    </List.Item>
  );
}

class ReviewComment extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      initLoading: true,
      loading: false,
      reachedEnd: false,
      reviews: [],
      offset: 0,
      sortKey: "helpful_desc",
    };
  }

  componentDidMount() {
    this.onLoadMore();
  }

  onLoadMore = () => {
    this.setState({
      loading: true,
    });
    axios.get(
      this.props.url, {
      params: {
        limit: this.props.perPage,
        offset: this.state.offset,
        sort: this.state.sortKey,
      }
    }).then(res => {
      const resLength = res.data.reviews.length;
      // exclude user's own review
      let userReviewId = -1;
      if (res.data.user_review) {
        userReviewId = res.data.user_review.reviewId;
      }
      const reviews = this.state.reviews.concat(
        res.data.reviews
          .filter(r => r.reviewId !== userReviewId)
      );
      this.setState({
        reviews: reviews,
        offset: this.state.offset + resLength,
        reachedEnd: resLength < this.props.perPage,
        loading: false,
        initLoading: false,
      });
    });
  };

  render() {
    const { initLoading, loading, reviews, reachedEnd } = this.state;
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
          <Button onClick={this.onLoadMore} loading={loading} icon={<DownOutlined />}>
            More reviews
          </Button>
        </div>
      ) : null;

    return (
      <div className="review-comment">
        <Select
          className="sort-selector"
          defaultValue={this.state.sortKey}
          suffixIcon={<Icon component={SortSvg} />}
          onChange={sortKey => {
            if (sortKey === this.state.sortKey) {
              return;
            }
            this.setState({
              initLoading: true,
              loading: false,
              reachedEnd: false,
              reviews: [],
              offset: 0,
              sortKey: sortKey,
            }, () => this.onLoadMore());
          }}
        >
          <Option value="helpful_desc">Most Helpful</Option>
          <Option value="create_desc">Most Recent</Option>
        </Select>
        <List
          loading={initLoading}
          loadMore={loadMore}
          dataSource={reviews}
          renderItem={review => <ReviewItem review={review} />}
        />
      </div>
    )
  }
}

export default ReviewComment