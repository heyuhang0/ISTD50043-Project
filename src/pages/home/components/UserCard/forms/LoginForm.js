import React from 'react';
import { Input, Button, Form } from 'antd';


function LoginForm(props) {
  return (
    <Form
      {...props.layout}
      onFinish={props.onFinish}
    >
      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: 'Please input your email address',
          },
          {
            type: "email",
            message: 'Please input a valid email address',
          }
        ]}
      >
        <Input placeholder="Email address" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: 'Please input your password',
          },
        ]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
          Login
        </Button>
      </Form.Item>
    </Form>
  );
}

export default LoginForm;
