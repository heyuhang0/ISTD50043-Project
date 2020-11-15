import React, { createElement, useState } from 'react';
import { Comment, Tooltip, List, Rate } from 'antd';
import axios from 'axios';
import './ReviewComment.less';
import { LikeFilled, LikeOutlined } from '@ant-design/icons';



function ReviewItem(props) {
    var liked = 0;
    const [likes, setLikes] = useState(props.review.helpful);
    const [action, setAction] = useState(null);


    const like = () => {
        if (liked === 0) {
            console.log("liked is ", liked)
            setLikes(likes + 1);
            // setDislikes(0);
            setAction('liked');
            liked = 1;
        }
    };

    const actions = [
        <Tooltip key="comment-basic-like" title="Like">
            <span onClick={like}>
                {createElement(action === 'liked' ? LikeFilled : LikeOutlined)}
                <span className="comment-action">{likes}
                </span>
            </span>
        </Tooltip>

    ];

    return (
        <List.Item>
            <Comment
                actions={actions}
                author={
                    <div>
                        <p>{props.review.reviewerName}</p>
                        <Rate
                            allowHalf
                            disabled
                            defaultValue={props.review.rating}
                        />
                    </div>
                }
                content={

                    <p>{props.review.reviewText}</p>

                }
                datetime={
                    <p>{props.review.reviewTime}</p>
                }
            />
        </List.Item>
    );
}

class ReviewComment extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            reviews: [],
            loading: true
        };
    }

    componentDidMount() {
        axios.get(this.props.url).then((res) => {
            this.setState({
                reviews: res.data,
                loading: false
            });
        });
    }

    render() {
        return (
            <div className="review-comment">
                <List
                    dataSource={this.state.reviews}
                    loading={this.state.loading}
                    // renderItem={review => {
                    //     console.log(review);
                    //     return <ReviewItem review={review} />;
                    // }}
                    renderItem={review => <ReviewItem review={review} />}
                />
            </div>
        )
    }
}

export default ReviewComment