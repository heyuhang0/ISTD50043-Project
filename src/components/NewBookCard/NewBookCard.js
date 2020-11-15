import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const NewBookForm = ({ visible, onCreate, onCancel }) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/categories').then((res) => {
      setCategories(res.data.category_list.filter(e => e));
      setLoading(false);
    });
  }, []);

  return (
    <Modal
      visible={visible}
      title="Add a new book"
      okText="Add"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          price: 0
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[
            {
              required: true,
              message: 'Please input the book title',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="author"
          label="Author"
          rules={[
            {
              required: true,
              message: 'Please input the author',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="url"
          label="Cover Image URL"
          rules={[
            {
              required: true,
              message: 'Please input the cover image URL',
            },
            {
              type: "url",
              message: 'Please input a valid URL',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Row gutter={20}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Category"
              rules={[
                {
                  required: true,
                  message: 'Please choose a category',
                }
              ]}
            >
              <Select
                showSearch
                placeholder="Select a category"
                optionFilterProp="children"
                loading={loading}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {categories.map((c) => <Option key={c._id}>{c.category}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="price"
              label="Price"
              rules={[
                {
                  required: true,
                  message: 'Please input the price',
                }
              ]}
            >
              <InputNumber
                min={0}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};


class NewBookCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formVisible: false,
    };
  }

  showModal = () => {
    this.setState({
      formVisible: true,
    });
  };

  onCreate = values => {
    console.log(values);
    this.setState({
      formVisible: false,
    });
  };

  onCancel = () => {
    this.setState({
      formVisible: false,
    });
  };

  render() {
    return (
      <Card className="card" title="Add Book">
        <p>Can't find the book?</p>
        <Button icon={<PlusOutlined />} onClick={this.showModal}>Add a new record</Button>
        <NewBookForm
          visible={this.state.formVisible}
          onCreate={this.onCreate}
          onCancel={this.onCancel}
        />
      </Card>
    );
  }

}

export default NewBookCard;
