import React from 'react';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';
import './Loader.css';

const Loader = ({ fullScreen = false, text = "Loading..." }) => {
    const containerClasses = fullScreen
        ? "loader-container loader-fullscreen"
        : "loader-container";

    return (
        <div className={containerClasses}>
            <Hourglass
                size="40"
                bgOpacity="0.1"
                speed="1.75"
                color="#6366f1"
            />
            {text && <span className="loader-text">{text}</span>}
        </div>
    );
};

export default Loader;
