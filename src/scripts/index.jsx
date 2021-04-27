import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from 'antd';

const App = () => (
    <>
        <h1>Sample React Component 2</h1>
        <Button
            type="primary"
            onClick={() => {
                alert('clicked');
            }}
        >
            Button
        </Button>
    </>
);

ReactDOM.render(<App />, document.getElementById('root'));
export default hot(App);
