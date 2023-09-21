import React from 'react';

export default function ({ className = `circular-progress-primary`,style={ width: "31px",height: "31px"} }) {

    return (
        <div className={className} style={style}>
        </div>
    );

}