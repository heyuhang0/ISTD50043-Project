import React from 'react';
import { Card, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import LoginForm from './forms/LoginForm';
import SignUpForm from './forms/SignUpForm';
import Cookies from 'universal-cookie';
import axios from 'axios';
import './UserCard.less';

const cookies = new Cookies();

class UserCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      username: null,
      tab: "Login",
    };

    this.onLogin = this.onLogin.bind(this);
  }

  reloadToken = () => {
    const token = cookies.get('token');
    if (!token) {
      this.setState({ loading: false, username: null });
      return;
    }
    axios.get('/api/users/me')
      .then(res => {
        this.setState({ loading: false, username: res.data.name });
      })
      .catch(error => this.onSignOut());
  }

  componentDidMount() {
    this.reloadToken();
  }

  onLogin = (token) => {
    cookies.set('token', token, { path: '/' });
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    this.reloadToken();
  }

  onSignOut = () => {
    cookies.remove('token', { path: '/' });
    this.setState({ loading: false, username: null, tab: 'Login' });
  }

  render() {
    // While confirming user information
    if (this.state.loading) {
      return <Card className="user-card" loading={true} />;
    }
  
    // If user already logged in
    if (this.state.username) {
      return (
        <Card className="user-card" title={"Hi, " + this.state.username}>
          <Button onClick={this.onSignOut} icon={<LogoutOutlined />}>Sign out</Button>
        </Card>
      )
    }

    // otherwise
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
          <LoginForm onLogin={this.onLogin} layout={layout} /> :
          <SignUpForm onLogin={this.onLogin} layout={layout} />
        }
      </Card>
    )
  }
}

export default UserCard;
