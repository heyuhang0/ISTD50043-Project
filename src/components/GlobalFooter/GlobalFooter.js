import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

function GlobalFooter(props) {
  return (
    <Footer style={{ textAlign: 'center' }}>
      SUTD 50.043 Database and Big Data Systems Project
    </Footer>
  );
}

export default GlobalFooter;
