import React from 'react';

export default function(props) {
  const { target, containerKey, width, height, className, children } = props;

  return (
    <div
      className={className}
      key={containerKey}
      style={{
        position: 'absolute',
        left: target.renderX - width / 2 + 'px',
        top: target.renderY - height / 2 + 'px',
        width: width + 'px',
        height: height + 'px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}
