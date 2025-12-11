import React from 'react';
import type { TokenProps } from '../types.js';

// Thêm React.FC<TokenProps> để TS biết đây là Component nhận props gì
const Token: React.FC<TokenProps> = ({ data, onClick, isSelected }) => {
  if (data.type === 'text') {
    return <span>{data.display}</span>;
  }

  const isName = /^[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯ]/.test(data.display);

  return (
    <span
      onClick={() => onClick(data)}
      style={{
        cursor: 'pointer',
        color: isSelected ? '#ffcc00' : (isName ? '#d8b4fe' : '#4ade80'),
        fontWeight: isName ? 'bold' : 'normal',
        borderBottom: isSelected ? '2px solid #ffcc00' : (isName ? '1px solid #d8b4fe' : '1px dashed #666'),
        marginRight: 4,
        backgroundColor: isSelected ? 'rgba(255, 204, 0, 0.1)' : 'transparent',
        transition: 'all 0.1s'
      }}
    >
      {data.display}
    </span>
  );
};

export default Token;