import React, { useState } from 'react';
import { Comment, Form, Button, Input, Rate, Typography, Modal } from 'antd';
import { LikeOutlined } from '@ant-design/icons';
import axios from 'axios';
import UserCard from '../../../../components/User/UserCard';
import UserAvatar from '../UserAvatar/UserAvatar';
import './AddReview.less';

const { TextArea } = Input;
const { Paragraph } = Typography;

const Editor = ({ onSubmit, submitting, initialValues }) => {
  const [loggedIn, setLoggedIn] = useState(!!window.localStorage.token);
  const [loginVisible, setLoginVisible] = useState(false);

  const onLogin = () => {
    if (window.localStorage.token) {
      setLoggedIn(true);
      return;
    }
    setLoginVisible(true);
  }

  const onLoginCancel = () => {
    setLoginVisible(false);
  }

  const onLoginSuccess = () => {
    window.location.reload();
  }

  if (!loggedIn) {
    return (
      <div>
        <p>Please <span className="login-button" onClick={onLogin}>login</span> to write a review.</p>
        <Modal
          className="user-login-modal"
          visible={loginVisible}
          onCancel={onLoginCancel}
          footer={null}
        >
          <UserCard onSuccessCallBack={onLoginSuccess}/>
        </Modal>
      </div>
    );
  }
  return (
    <Form
      onFinish={onSubmit}
      initialValues={initialValues}
    >
      <Form.Item
        name="rating"
        rules={[{
          required: true,
          message: 'Overall rating is required',
        }]}
      >
        <Rate />
      </Form.Item>
      <Form.Item
        name="summary"
        rules={[{
          required: true,
          message: 'Summary is required',
        }]}
      >
        <Input placeholder="Headline or summary of your review (required)" />
      </Form.Item>
      <Form.Item
        name="reviewText"
        rules={[{
          required: true,
          message: 'Review is required',
        }]}
      >
        <TextArea rows={3} placeholder="Write your review here (required)" />
      </Form.Item>
      <Form.Item>
        <Button htmlType="submit" loading={submitting}>Submit</Button>
      </Form.Item>
    </Form>
  )
};


class AddReview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      userReview: null,
      submitting: false,
      // reviewId and initialValues are used to update review
      reviewId: null,
      initialValues: null
    };
  }

  componentDidMount() {
    axios.get(
      `/api/books/${this.props.asin}/reviews`, {
      params: {
        limit: 1,
        offset: 0,
      }
    }).then(res => {
      this.setState({ userReview: res.data.user_review });
    });
  }

  handleSubmit = (values) => {
    this.setState({ submitting: true });

    if (this.state.reviewId) {
      axios.put(`/api/books/${this.props.asin}/reviews/${this.state.reviewId}`, values)
        .then(res => {
          this.setState({
            userReview: res.data.updated_review,
            submitting: false
          });
        })
        .catch(console.log);
    } else {
      axios.post(`/api/books/${this.props.asin}/reviews`, values)
        .then(res => {
          let review = res.data.review;
          review.user = res.data.user;
          this.setState({
            userReview: review,
            submitting: false
          });
        })
        .catch(console.log);
    }
  }

  handleEdit = () => {
    this.setState({
      reviewId: this.state.userReview.reviewId,
      userReview: null,
      initialValues: {
        rating: this.state.userReview.rating,
        summary: this.state.userReview.summary,
        reviewText: this.state.userReview.reviewText,
      }
    });
  }

  render() {
    const { userReview, initialValues, submitting } = this.state;
    return (
      <div className="user-review">
        {userReview == null ?
          <Editor
            onSubmit={this.handleSubmit}
            initialValues={initialValues}
            submitting={submitting}
          /> :
          <Comment
            className="user-review-item"
            actions={[
              <span>
                <LikeOutlined />
                <span className="comment-likes">{userReview.helpful}</span>
              </span>,
              <span onClick={this.handleEdit}>Edit</span>
            ]}
            author={userReview.user.name}
            avatar={<UserAvatar username={userReview.user.name} />}
            datetime={userReview.updatedAt.substring(0, 10)}
            content={
              <div>
                <Rate
                  allowHalf
                  disabled
                  defaultValue={userReview.rating}
                />
                <h3>{userReview.summary}</h3>
                <Paragraph ellipsis={{ rows: 5, expandable: true, symbol: 'more' }}>
                  {userReview.reviewText}
                </Paragraph>
              </div>
            }
          />
        }
      </div>
    );
  }
}

export default AddReview;
