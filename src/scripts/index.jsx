/* development-only-start */
import { hot } from 'react-hot-loader/root';
/* development-only-end */
import style from '../style/index.module.less';
import img1 from '../images/data-story-prototype-1.jpg';
import img2 from '../images/data-story-prototype-2.jpg';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';
import { v4 as uuidV4 } from 'uuid';

const dummyText =
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

class Cover extends React.Component {
    render() {
        return (
            <div className={style.mapContainer}>
                <img className={style.mapPlaceholder} src={img1} />
            </div>
        );
    }
}

class ShowCase extends React.Component {
    render() {
        return (
            <div className={style.showCaseContainer}>
                {[...Array(5).keys()].map(() => (
                    <div key={uuidV4()} className={style.section} id="section1">
                        <img id="img1" className={style.img} src={img2} />
                        <div id="text1" className={style.text}>
                            {dummyText}
                        </div>
                    </div>
                ))}
                <div className={style.section}></div>
            </div>
        );
    }
}

const App = () => (
    <>
        <Helmet>
            <title>Data Story (Skeleton)</title>
        </Helmet>
        <Cover />
        <ShowCase />
    </>
);

ReactDOM.render(<App />, document.getElementById('root'));

/* development-only-start */
export default hot(App);
/* development-only-end */
