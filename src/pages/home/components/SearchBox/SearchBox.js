import React from 'react';
import { Input, Tag } from 'antd';
import axios from 'axios';
import './SearchBox.less';

const { Search } = Input;
const { CheckableTag } = Tag;

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestions: []
    };

    this.onSearch = this.onSearch.bind(this);
  }

  componentDidMount() {
    axios.get("/api/categories/suggested").then((res) => {
      this.setState({ suggestions: res.data.category_list.filter(e => e) });
    });
  }

  onSearch(keyword) {
    if (!keyword) {
      return;
    }
    this.props.history.push('/search?q=' + escape(keyword));
  }

  render() {
    return (
      <div className="search-box">
        <Search
          placeholder="Title / Author / ASIN"
          allowClear
          enterButton
          size="large"
          onSearch={this.onSearch}
        />
        <div className="search-box-suggestions">
          {this.state.suggestions.map(s => (
            <CheckableTag
              key={s._id}
              onChange={() => this.onSearch('category: "' + s.category + '"')}
            >{s.category}</CheckableTag>
          ))}
        </div>
      </div>
    );
  }
}

export default SearchBox;
