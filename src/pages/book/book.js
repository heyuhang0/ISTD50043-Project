import { useParams, withRouter } from 'react-router-dom'

function Book(props) {
  const { asin } = useParams();
  return <h1>Book Page for Book {asin}</h1>;
}

export default withRouter(Book);
