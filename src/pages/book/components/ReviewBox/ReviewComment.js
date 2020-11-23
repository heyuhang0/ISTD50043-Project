import React, { createElement, useState } from 'react';
import { Comment, Tooltip, List, Rate, Typography, Button, Avatar } from 'antd';
import axios from 'axios';
import './ReviewComment.less';
import { LikeFilled, LikeOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
  }
  return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
  };
}

function strHash(s) {
  let hash = 0, i, chr;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

function generateColor(seedStr) {
  let h = Math.abs(strHash(seedStr) % 360) / 360;
  let s = 0.6, v = 0.85;
  let color = HSVtoRGB(h, s, v);
  return "rgb(" + color.r + "," + color.g + "," + color.b + ")";
}

function DummyAvatar(props) {
  let color = generateColor(props.name);
  return (<Avatar style={{ backgroundColor: color}} >{props.name.substring(0, 1)}</Avatar>);
}

function ReviewItem(props) {
  const [likes, setLikes] = useState(props.review.helpful);
  const [action, setAction] = useState(null);

  const like = () => {
    console.log(action);
    if (action !== 'liked') {
      axios
        .post(`/api/books/${props.review.asin}/reviews/${props.review.reviewId}/upvote`,
          {
            reviewid: props.review.reviewId
          }
        )
        .then(res => {
          console.log(res);
        })
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
        avatar={<DummyAvatar name={props.review.user.name} />}
        datetime={props.review.updatedAt.substring(0, 10)}
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
    };
  }

  componentDidMount() {
    axios.get(
      this.props.url, {
      params: {
        limit: this.props.perPage,
        offset: 0,
      }
    }).then(res => {
      this.setState({
        reviews: res.data.reviews,
        initLoading: false,
        reachedEnd: res.data.reviews.length < this.props.perPage,
      });
    });
  }

  onLoadMore = () => {
    this.setState({
      loading: true,
    });
    axios.get(
      this.props.url, {
      params: {
        limit: this.props.perPage,
        offset: this.state.reviews.length,
      }
    }).then(res => {
      const reviews = this.state.reviews.concat(res.data.reviews);
      this.setState({
        reviews: reviews,
        loading: false,
        reachedEnd: res.data.reviews.length < this.props.perPage,
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
          <Button onClick={this.onLoadMore} loading={loading}>More reviews</Button>
        </div>
      ) : null;

    return (
      <div className="review-comment">
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