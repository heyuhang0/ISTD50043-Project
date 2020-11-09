import React from 'react';
import { Comment, Form, Button, List, Input, Rate, Modal } from 'antd';
import moment from 'moment';
import './AddReview.less';

const { TextArea } = Input;

const CommentList = ({ comments }) => (
  <List
    dataSource={comments}
    itemLayout="horizontal"
    renderItem={props => <Comment {...props} />}
  />
);

const Editor = ({ onChange, onSubmit, submitting, value, rate, onChangeRate }) => (
  <>
    <Form.Item>
      <Rate
        onChange={onChangeRate}
        defaultValue={rate}
      />
    </Form.Item>
    <Form.Item>
      <TextArea rows={4} onChange={onChange} value={value} />
    </Form.Item>
    <Form.Item>
      <Button htmlType="submit" loading={submitting} onClick={onSubmit} type="primary">
        Add A Review
      </Button>
    </Form.Item>
  </>
);


class AddReview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      comments: [],
      submitting: false,
      value: '',
      rate: 0,
      submitted: false,
    };
  }

  handleSubmit = () => {
    if (!this.state.submitted) {
      console.log(this.state)
      if (!this.state.value) {
        return;
      }

      this.setState({
        submitting: true,
      });

      setTimeout(() => {
        console.log(this.state)
        this.setState({
          submitting: false,
          value: '',
          rate: 0,
          submitted: true,
          comments: [
            {
              author: <div>
                <p>Yuhang</p>
                <Rate
                  value={this.state.rate}
                />
              </div>,
              content: <p>{this.state.value}</p>,
              datetime: moment().fromNow(),
            },
            ...this.state.comments,
          ],
        });
      }, 1000);
    };
    console.log("You have submitted once!")
  };

  handleChange = e => {
    console.log(e.target.value)
    this.setState({
      value: e.target.value,
    });
  };

  handleChangeRate = e => {
    this.setState({
      rate: e,
    })
  }

  render() {
    const { comments, submitting, value, rate, submitted } = this.state;
    console.log(submitted)
    if (!submitted) {
      return (
        <>
          <Comment
            content={
              <Editor
                onChange={this.handleChange}
                onChangeRate={this.handleChangeRate}
                onSubmit={this.handleSubmit}
                submitting={submitting}
                value={value}
                rate={rate}
              />
            }
          />
          {comments.length > 0 && <CommentList comments={comments} />}
        </>
      );
    }
    return (
      <>
        <Comment
          content={
            <Editor
              onChange={this.handleChange}
              onChangeRate={this.handleChangeRate}
              onSubmit={this.handleSubmit}
              submitting={submitting}
              value={value}
              rate={rate}
            />
          }
        />
        {comments.length > 0 && <CommentList comments={comments} />}
      </>
    );;
  }
  return;
}

export default AddReview
