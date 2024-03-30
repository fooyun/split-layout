import { Layout } from '@/src/SplitLayout';
import SplitCounter from './SplitCounter';
import style from './demo.module.css';

function Demo() {
  return (
    <div className={style.container}>
      <Layout resizerClassName={style.resizer}>
        <SplitCounter />
        <SplitCounter />
      </Layout>
    </div>
  );
}

export default Demo;
