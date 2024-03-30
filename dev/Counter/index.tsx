import { useState } from 'react';

const Counter = () => {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      <span>current is: {counter}</span>
      <span
        style={{ color: 'green', marginLeft: '20px', cursor: 'pointer' }}
        onClick={() => setCounter((c) => c + 1)}
      >
        add
      </span>
    </div>
  );
};

export default Counter;
