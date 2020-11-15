import React from 'react';
import { Comment, Form, Button, List, Input, Rate, Modal } from 'antd';
import moment from 'moment';
import './AddReview.less';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const { TextArea } = Input;

const CommentList = ({ comments }) => (
  <List
    dataSource={comments}
    itemLayout="horizontal"
    renderItem={props => <Comment {...props} />}
  />
);

const Editor = ({ onChange, onSubmit, submitting, value, rate, onChangeRate, visible, handleOk, handleCancel }) => (
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
      <Modal
        title="Basic Modal"
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>You have submitted your review once. Please do not submit again.</p>
      </Modal>
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
      visible: false,
    };
  };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = e => {
    console.log(e);
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    console.log(e);
    this.setState({
      visible: false,
    });
  };

  handleSubmit = () => {
    if (!this.state.submitted) {
      console.log(this.state)
      // axios
      //   .post(`/api/books/${asin}/reviews`, this.state)
      //   .then(res => {
      //     console.log(res);
      //   })
      //   .catch(err =>
      //     console.log(err))

      if (!this.state.value) {
        return;
      }

      this.setState({
        submitting: true,
      });

      setTimeout(() => {
        // console.log(this.state)
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
    if (this.state.submitted) {
      // console.log(this.state.submitted)
      // console.log("You have submitted once!")
      this.showModal();
    };
  };

  handleChange = e => {
    // console.log(e.target.value)
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
    const { comments, submitting, value, rate, submitted, visible } = this.state;
    // console.log(submitted)

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
              visible={visible}
              handleOk={this.handleOk}
              handleCancel={this.handleCancel}
            />
          }
        />
        {comments.length > 0 && <CommentList comments={comments} />}
      </>
    );

  };
};

export default AddReview
