# split-layout

此组件允许您垂直和水平分割屏幕，并支持无限嵌套。同时，它还会维护已分割部分的状态。

你可以调整窗格大小、垂直或水平分割窗格，以及关闭窗格。

[English Documentation](./README.md)

## 在线演示
[演示](https://fooyun.github.io/split-layout/)

## 安装
```bash
npm install @fooyun/split-layout
```

## 使用
```jsx
import { useContext, useState } from 'react';
import { Layout, PaneContext } from '@fooyun/split-layout';

const Counter = () => {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      <span>当前计数: {counter}</span>
      <span
        style={{ color: 'green', marginLeft: '20px', cursor: 'pointer' }}
        onClick={() => setCounter((c) => c + 1)}
      >
        增加
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
        <span style={operateBtnStyle} onClick={splitVertical}>垂直分割</span>
        <span style={operateBtnStyle} onClick={splitHorizontal}>水平分割</span>
        {paneContext?.canClose && <span style={operateBtnStyle} onClick={removePane}>关闭</span>}
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
