import React from 'react';
import { Input, Button, Form, message } from 'antd';
import axios from 'axios';


function LoginForm(props) {
  function onLogin(form) {
    axios.post('/api/users/login', form)
      .then(res => {
        props.onLogin(res.data.token);
      })
      .catch(error => {
        console.error(error);
        message.error(error.response ?
          error.response.data.error_msg : "Unknown error");
      });
  }
  return (
    <Form
      {...props.layout}
      onFinish={onLogin}
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
