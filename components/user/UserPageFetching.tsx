import { Container, Row, Col } from "react-bootstrap";

export default function UserPageFetching() {
     return (
       <Container className="pt-5 text-center">
         <Row>
           <Col>
             <h4 className="mb-0 float-none">Fetching User...</h4>
           </Col>
         </Row>
       </Container>
     );
}