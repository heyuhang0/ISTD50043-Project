import React from 'react';
import { Comment, Form, Button, List, Input, Rate, Modal } from 'antd';
import moment from 'moment';
import './AddReview.less';
import axios from 'axios';

const { TextArea } = Input;

const CommentList = ({ comments }) => (
  <List
    dataSource={comments}
    itemLayout="horizontal"
    renderItem={props => <Comment {...props} />}
  />
);

const Editor = ({ onChange, onChangeSummary, onSubmit, submitting, summary, value, rate, onChangeRate, visible, handleOk, handleCancel }) => (
  <>
    <Form.Item>
      <Rate
        onChange={onChangeRate}
        defaultValue={rate}
      />
    </Form.Item>
    <Form.Item>
      <TextArea rows={1} placeholder="Headline or summary of your review (required)" onChange={onChangeSummary} value={summary} />
    </Form.Item>
    <Form.Item>
      <TextArea rows={4} placeholder="Write your review here (required)" onChange={onChange} value={value} />
    </Form.Item>
    <Form.Item>
      <Button htmlType="submit" loading={submitting} onClick={onSubmit} type="primary">
        Submit
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
      summary: '',
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
      console.log(this.props.asin)
      axios
        .post(`/api/books/${this.props.asin}/reviews`,
          {
            asin: this.props.asin,
            summary: this.state.summary,
            reviewText: this.state.value,
            rating: this.state.rate,
          }
        )
        .then(res => {
          console.log(res);
        })
        .catch(err =>
          console.log(err))

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
          summary: '',
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
              content:
                <div><p>{this.state.summary}</p>
                  <p>{this.state.value}</p>
                </div>,
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

  handleChangeSummary = e => {
    console.log(e.target.value)
    this.setState({
      summary: e.target.value,
    });
  };

  handleChangeRate = e => {
    this.setState({
      rate: e,
    })
  }

  render() {
    const { comments, submitting, summary, value, rate, visible } = this.state;
    // console.log(submitted)

    return (
      <div>
        <Editor
          onChange={this.handleChange}
          onChangeSummary={this.handleChangeSummary}
          onChangeRate={this.handleChangeRate}
          onSubmit={this.handleSubmit}
          submitting={submitting}
          summary={summary}
          value={value}
          rate={rate}
          visible={visible}
          handleOk={this.handleOk}
          handleCancel={this.handleCancel}
        />
        {comments.length > 0 && <CommentList comments={comments} />}
      </div>
    );

  };
};

export default AddReview
