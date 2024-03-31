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
        <span onClick={splitVertical}>vertical</span>
        <span onClick={splitHorizontal}>horizontal</span>
        {paneContext?.canClose && <span onClick={removePane}>close</span>}
      </div>
      <div>
        <Counter />
      </div>
    </div>
  );
}

export default SplitCounter;
