import React from 'react';
import { colors } from 'utils';
import Text from 'elements/text';

const Input = ({
  value,
  type,
  name,
  label,
  errorText,
  onChange,
  onBlur,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  width,
  style,
  focus,
  checked,
  inputStyle,
}) => {
  const ref = React.useRef();
  React.useEffect(() => {
    if (focus) {
      ref.current.focus();
    }
  }, [focus]);

  const cStyles = {
    width,
    overflow: 'hidden',
  };
  inputStyle = inputStyle || {};
  if (type === 'checkbox') {
    cStyles.display = 'flex';
    cStyles.justifyContent = 'flex-start';
    cStyles.alignItems = 'center';
  }
  return (
    <div
      style={{
        ...cStyles,
        ...style,
      }}
    >
      {name && label ? (
        <label style={{ color: colors.lightBlue }} htmlFor={name}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        checked={checked}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          margin: '5px',
          width,
          ...inputStyle,
        }}
      ></input>
      {errorText ? <Text type="error">{errorText}</Text> : null}
    </div>
  );
};

export default Input;
