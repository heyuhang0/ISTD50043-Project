import React from 'react';
import { Input, Button, Form, message } from 'antd';
import axios from 'axios';


function SignUpForm(props) {
  function onSignUp(form) {
    axios.post('/api/users/register', form)
      .then(res => {
        props.onLogin(res.data.token);
      })
      .catch(error => {
        console.error(error);
        message.error(error.response ?
          error.response.data.error_msg : "Unknown error");
      });
  };

  return (
    <Form
      {...props.layout}
      onFinish={onSignUp}
    >
      <Form.Item
        name="name"
        rules={[
          {
            required: true,
            message: 'Please input your name',
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
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please input your password',
          }, {
            min: 8,
            message: '❌ At least 8 characters in length'
          }, {
            pattern: /^.*\d.*$/,
            message: '❌ At least one number'
          }, {
            pattern: /^.*[a-z].*$/,
            message: '❌ At least one lowercase letter'
          }, {
            pattern: /^.*[A-Z].*$/,
            message: '❌ At least one uppercase letter'
          }
        ]}
      >
        <Input.Password placeholder="Password" />
      </Form.Item>

      <Form.Item
        name="password2"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'Please confirm your password',
          },
          ({ getFieldValue }) => ({
            validator(rule, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject('The two passwords do not match');
            },
          }),
        ]}
      >
        <Input.Password placeholder="Confirm password" />
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
