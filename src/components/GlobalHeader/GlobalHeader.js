import React from 'react';
import { withRouter } from 'react-router-dom';
import { Input } from 'antd';
import './GlobalHeader.less';

const { Search } = Input;

function GlobalHeader(props) {
  return (
    <header className="global-header">
      <img
        className="text-logo"
        alt="Logo"
        onClick={() => props.history.push('/')}
      />
      <Search
        className="search-box"
        placeholder="Title / Author / ASIN"
        allowClear
        enterButton
        defaultValue={props.defaultValue}
        onSearch={keyword => {
          if (!keyword) {
            return;
          }
          props.history.push('/search?q=' + escape(keyword));
          if (props.reloadOnSearch) {
            window.location.reload();
          }
        }}
        size="large"
      />
    </header>
  );
}

export default withRouter(GlobalHeader);
