import React from 'react';
import { withRouter } from 'react-router-dom';
import { Input } from 'antd';
import './GlobalHeader.less';

const { Search } = Input;

function GlobalHeader(props) {
  return (
    <header className="global-header">
      <a onClick={() => props.history.push('/')}>
        <img alt="Logo" className="text-logo" />
      </a>
      <Search
        className="search-box"
        placeholder="Title / Author / ASIN"
        allowClear
        enterButton
        onSearch={keyword => {
          console.log(keyword);
          props.history.push('/search?q=' + escape(keyword));
        }}
        size="large"
      />
    </header>
  );
}

export default withRouter(GlobalHeader);
