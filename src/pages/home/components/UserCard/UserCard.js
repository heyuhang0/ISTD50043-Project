import React from 'react';
import { Card } from 'antd';
import LoginForm from './forms/LoginForm';
import SignUpForm from './forms/SignUpForm';
import './UserCard.less';

class UserCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: "Login",
    };

    this.onSignUp = this.onSignUp.bind(this);
    this.onLogin = this.onLogin.bind(this);
  }

  onLogin(form) {
    console.log('Login:', form);
  }

  onSignUp(form) {
    console.log('Sign Up:', form);
  }

  render() {
    const tabList = [
      {
        key: "Login",
        tab: "Login",
      },
      {
        key: "Sign Up",
        tab: "Sign Up",
      }
    ];

    const layout = {
      wrapperCol: {
        offset: 2,
        span: 20,
      },
    };

    return (
      <Card
        className="user-card"
        tabList={tabList}
        onTabChange={(key) => this.setState({ tab: key })}
      >
        {this.state.tab === "Login" ?
          <LoginForm onFinish={this.onLogin} layout={layout} /> :
          <SignUpForm onFinish={this.onSignUp} layout={layout} />
        }
      </Card>
    )
  }
}

export default UserCard;
