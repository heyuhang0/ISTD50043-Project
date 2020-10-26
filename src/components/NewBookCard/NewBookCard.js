import React from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

function NewBookCard(props) {
  return (
    <Card className="card" title="Add Book">
      <p>Can't find the book?</p>
      <Button icon={<PlusOutlined />}>Add a new record</Button>
    </Card>
  )
}

export default NewBookCard;
