import { useContext } from 'react';
import { PaneContext } from '@/src/SplitLayout';
import Counter from '../Counter';
import style from './index.module.css';

function SplitCounter() {
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

  return (
    <div>
      <div className={style.operate}>
        <span onClick={splitVertical}>垂直分屏</span>
        <span onClick={splitHorizontal}>水平分屏</span>
        {paneContext?.canClose && <span onClick={removePane}>关闭分屏</span>}
      </div>
      <div>
        <Counter />
      </div>
    </div>
  );
}

export default SplitCounter;
