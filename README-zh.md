# split-layout

这是一个分屏组件.

你可以调整分屏大小，垂直分屏/水平分屏/关闭分屏。

```jsx
import { useContext, useState } from 'react';
import { Layout, PaneContext } from '@fooyun/split-layout';

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

const SplitCounter = () => {
  const paneContext = useContext(PaneContext);

  const splitVertical = () => {
    paneContext?.splitVertical(<SplitCounter />);
  };

  const splitHorizontal = () => {
    paneContext?.splitHorizontal(<SplitCounter />);
  };

  const removePane = () => {
    paneContext?.removePane();
  };

  const operateStyle = {
    textAlign: 'right',
    marginBottom: '20px',
  };

  const operateBtnStyle = {
    marginLeft: '10px',
    color: '#08f',
    cursor: 'pointer',
  };

  return (
    <div>
      <div style={operateStyle}>
        <span style={operateBtnStyle} onClick={splitVertical}>垂直分屏</span>
        <span style={operateBtnStyle} onClick={splitHorizontal}>水平分屏</span>
        {paneContext?.canClose && <span style={operateBtnStyle} onClick={removePane}>关闭分屏</span>}
      </div>
      <div>
        <Counter />
      </div>
    </div>
  );
}

export default () => {
  return (
    <div style={{width: '100%', height: 300, border: 'solid 1px red'}}>
      <Layout>
        <SplitCounter />
        <SplitCounter />
      </Layout>
    </div>
  );
}
```
