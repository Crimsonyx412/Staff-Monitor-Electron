import React from 'react';
import classnames from 'classnames';
const TextInputGroup = ({
  label,
  type,
  value,
  onChange,
  name,
  placeholder,
  error
}) => {
  return (
    <div className="from-group">
      <label htmlFor={name}>{label}</label>
      <input
        type={type | 'test'}
        name={name}
        className={classnames(' form-control from-control-lg', {
          'is-invalid': error
        })}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};
export default TextInputGroup;
