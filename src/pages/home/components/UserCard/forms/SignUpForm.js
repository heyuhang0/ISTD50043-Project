import React from 'react';
import { Input, Button, Form } from 'antd';


function SignUpForm(props) {
  return (
    <Form
      {...props.layout}
      onFinish={props.onFinish}
    >
      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: 'Please input your name!',
          },
        ]}
      >
        <Input placeholder="Name" />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: 'Please input your email address!',
          },
        ]}
      >
        <Input placeholder="Email address" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
        ]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
          Sign Up
        </Button>
      </Form.Item>
    </Form>
  );
}

export default SignUpForm;
