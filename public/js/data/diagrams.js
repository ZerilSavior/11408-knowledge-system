// 模块: diagrams（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const DIAGRAMS = {

  sys: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">计算机系统</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node lv1">硬件系统<small>物理设备</small></div>

        <div class="dg-branch">

          <div class="dg-col">

            <div class="dg-node">主机</div>

            <div class="dg-branch">

              <div class="dg-col">

                <div class="dg-node">CPU</div>

                <div class="dg-branch">

                  <div class="dg-col"><div class="dg-node leaf">运算器</div></div>

                  <div class="dg-col"><div class="dg-node leaf">控制器</div></div>

                </div>

              </div>

              <div class="dg-col"><div class="dg-node leaf">主存</div></div>

            </div>

          </div>

          <div class="dg-col">

            <div class="dg-node">外部设备<small>I / O 设备</small></div>

            <div class="dg-branch">

              <div class="dg-col"><div class="dg-node leaf">输入设备</div></div>

              <div class="dg-col"><div class="dg-node leaf">输出设备</div></div>

              <div class="dg-col"><div class="dg-node leaf">辅存</div></div>

            </div>

          </div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node lv1">软件系统<small>程序 · 文档</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">系统软件</div></div>

          <div class="dg-col"><div class="dg-node leaf">应用软件</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note"><b>冯·诺依曼五大部件</b> ＝ 运算器 ＋ 控制器 ＋ 存储器 ＋ 输入设备 ＋ 输出设备<br><b>CPU</b> ＝ 运算器 ＋ 控制器　|　<b>主机</b> ＝ CPU ＋ 主存（主存储器）　|　存储器分主存（属主机）与辅存（辅助存储器，属外设）<br><b>系统软件</b>：操作系统、编译 / 汇编 / 解释程序、数据库管理系统、网络软件、语言处理程序　|　<b>应用软件</b>：科学计算、工程设计、数据处理、事务管理、过程控制等用户程序</div>

  </div></div>`,

  hw: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">计算机硬件系统</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">主机<small>CPU ＋ 主存</small></div>

        <div class="dg-branch">

          <div class="dg-col">

            <div class="dg-node">CPU</div>

            <div class="dg-branch">

              <div class="dg-col"><div class="dg-node leaf">运算器</div></div>

              <div class="dg-col"><div class="dg-node leaf">控制器</div></div>

            </div>

          </div>

          <div class="dg-col"><div class="dg-node leaf">主存储器</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">I/O 接口<small>连接主机与外设</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">输入设备</div></div>

          <div class="dg-col"><div class="dg-node leaf">输出设备</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">系统总线<small>各部件间传输信息</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">数据总线<small>双向</small></div></div>

          <div class="dg-col"><div class="dg-node leaf">地址总线<small>单向</small></div></div>

          <div class="dg-col"><div class="dg-node leaf">控制总线</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">现代计算机以<b>存储器为中心</b>：CPU 通过系统总线与主存、I/O 接口相连；辅助存储器（磁盘、SSD）属于外部设备。</div>

  </div></div>`

,

  memhier: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">存储层次结构<small>Cache → 主存 → 辅存</small></div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">Cache<small>静态RAM实现</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">速度快、容量小</div></div>

          <div class="dg-col"><div class="dg-node leaf">与CPU同量级</div></div>

          <div class="dg-col"><div class="dg-node leaf">对程序员透明</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">主存<small>DRAM实现</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">存放运行中的程序和数据</div></div>

          <div class="dg-col"><div class="dg-node leaf">CPU可直接访问</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">辅存<small>磁盘 / SSD</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">容量大、速度慢、价格低</div></div>

          <div class="dg-col"><div class="dg-node leaf">与主存交换信息</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">越往上：<b>速度越快、容量越小、单位价格越贵</b>；靠“局部性原理”使访问大多命中高层，实现大容量＋高速度。</div>

  </div></div>`

,

  cmap: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">Cache 与主存的映射方式</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">直接映射</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">主存块 j 只映射到 Cache 行 i = j mod C</div></div>

          <div class="dg-col"><div class="dg-node leaf">实现简单、命中率低</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">全相联映射</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">任意主存块可装入任意 Cache 行</div></div>

          <div class="dg-col"><div class="dg-node leaf">命中率最高、比较开销大</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">组相联映射</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">分组：组间直接映射、组内全相联</div></div>

          <div class="dg-col"><div class="dg-node leaf">折中方案，实际常用（如 2 路 / 4 路）</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">地址结构：<b>标记 ＋ 组号（行号）＋ 块内地址</b>；直接映射含行号字段，全相联只有标记，组相联为标记＋组号。</div>

  </div></div>`

,

  crep: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">Cache 替换算法</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">LRU<small>近期最久未用</small></div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">替换最久未被访问的行；命中率高，需计数位</div></div></div>

      </div>

      <div class="dg-col">

        <div class="dg-node">FIFO<small>先进先出</small></div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">替换最早装入的行；实现简单，可能抖动</div></div></div>

      </div>

      <div class="dg-col">

        <div class="dg-node">随机替换</div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">随机选择淘汰行；实现最简单，性能不稳定</div></div></div>

      </div>

    </div>

    <div class="dg-note">只在<b>未命中且 Cache 已满</b>时发生；全相联与组相联需要替换策略，直接映射无需选择（位置唯一）。</div>

  </div></div>`

,

  virt: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">虚拟存储器</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">页式<small>固定大小分页</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">逻辑地址＝页号＋页内地址</div></div>

          <div class="dg-col"><div class="dg-node leaf">页表完成地址转换，缺页调入</div></div>

          <div class="dg-col"><div class="dg-node leaf">有 TLB 加快查找</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">段式<small>按逻辑模块分段</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">段长可变，便于共享与保护</div></div>

          <div class="dg-col"><div class="dg-node leaf">易产生外部碎片</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">段页式<small>先分段再分页</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">段表 ＋ 页表两级转换</div></div>

          <div class="dg-col"><div class="dg-node leaf">兼得分页内存利用率与分段逻辑性</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">本质：<b>主存 ＋ 辅存</b>构成统一逻辑地址空间，基于局部性原理，用缺页中断与页面置换实现“大内存”。</div>

  </div></div>`

,

  trans: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">从源程序到可执行程序</div>

    <div class="dg-branch">

      <div class="dg-col"><div class="dg-node leaf">源程序<br><small>高级语言 .c</small></div></div>

      <div class="dg-col"><div class="dg-node">预处理器</div></div>

      <div class="dg-col"><div class="dg-node">编译器</div></div>

      <div class="dg-col"><div class="dg-node">汇编器</div></div>

      <div class="dg-col"><div class="dg-node">链接器</div></div>

      <div class="dg-col"><div class="dg-node leaf">可执行文件<br><small>机器码</small></div></div>

    </div>

    <div class="dg-note">编译器：高级语言 → 汇编语言　|　汇编器：汇编语言 → 可重定位机器码　|　链接器：合并模块与库文件生成可执行文件。</div>

  </div></div>`

,

  intr: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">中断与异常</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">内中断<small>异常，CPU 内部产生</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">故障<small>缺页、除零、非法指令</small></div></div>

          <div class="dg-col"><div class="dg-node leaf">陷阱<small>系统调用、自陷指令</small></div></div>

          <div class="dg-col"><div class="dg-node leaf">终止<small>硬件故障，不可恢复</small></div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">外中断<small>中断，外部设备请求</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">可屏蔽中断<small>INTR</small></div></div>

          <div class="dg-col"><div class="dg-node leaf">不可屏蔽中断<small>NMI，如电源故障</small></div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">响应过程：<b>关中断 → 保存断点 → 识别中断源 → 转中断服务程序</b>；与指令执行是异步（外中断）或同步（内中断）关系。</div>

  </div></div>`

,

  pipe: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">指令流水线<small>时间并行</small></div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">经典五段</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">IF 取指</div></div>

          <div class="dg-col"><div class="dg-node leaf">ID 译码</div></div>

          <div class="dg-col"><div class="dg-node leaf">EX 执行</div></div>

          <div class="dg-col"><div class="dg-node leaf">MEM 访存</div></div>

          <div class="dg-col"><div class="dg-node leaf">WB 写回</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">性能</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">吞吐率提高，每条指令时间不缩短</div></div>

          <div class="dg-col"><div class="dg-node leaf">理想加速比＝流水段数 k</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">冒险</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">结构冒险</div></div>

          <div class="dg-col"><div class="dg-node leaf">数据冒险</div></div>

          <div class="dg-col"><div class="dg-node leaf">控制冒险</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">流水线把指令执行过程按功能划分为若干段，各段<b>重叠工作</b>；理想情况下每个时钟周期流出一条指令。</div>

  </div></div>`

,

  hazard: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">流水线冒险与处理</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">结构冒险<small>硬件资源冲突</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">指令与数据争用同一存储器</div></div>

          <div class="dg-col"><div class="dg-node leaf">解决：指令/数据 Cache 分离、插入暂停</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">数据冒险<small>数据依赖</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">后一条指令需前一条结果</div></div>

          <div class="dg-col"><div class="dg-node leaf">解决：转发/旁路、插入气泡、调整顺序</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">控制冒险<small>转移指令</small></div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">转移改变取指顺序</div></div>

          <div class="dg-col"><div class="dg-node leaf">解决：分支预测、延迟转移、预取目标</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">三种冒险本质：<b>资源、数据、控制</b>三类冲突破坏流水线重叠，处理方式核心是“暂停、旁路、预测”。</div>

  </div></div>`

,

  flynn: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">Flynn 分类法</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">SISD</div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">单指令流单数据流<br><small>传统单处理器</small></div></div></div>

      </div>

      <div class="dg-col">

        <div class="dg-node">SIMD</div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">单指令流多数据流<br><small>向量处理器、阵列机</small></div></div></div>

      </div>

      <div class="dg-col">

        <div class="dg-node">MISD</div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">多指令流单数据流<br><small>理论上存在，实际没有</small></div></div></div>

      </div>

      <div class="dg-col">

        <div class="dg-node">MIMD</div>

        <div class="dg-branch"><div class="dg-col"><div class="dg-node leaf">多指令流多数据流<br><small>多核、多处理器、SMP</small></div></div></div>

      </div>

    </div>

    <div class="dg-note">按<b>指令流与数据流</b>的数量划分计算机体系结构；多核与 SMP 属于 MIMD。</div>

  </div></div>`

,

  mc: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">多处理器系统</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">多核处理器</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">一个芯片内集成多个 CPU 核</div></div>

          <div class="dg-col"><div class="dg-node leaf">核间通过片上互连通信</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">硬件多线程</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">细粒度：每周期切换线程</div></div>

          <div class="dg-col"><div class="dg-node leaf">粗粒度：阻塞时切换线程</div></div>

          <div class="dg-col"><div class="dg-node leaf">同时多线程 SMT：并发发多条指令</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">SMP</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">对称多处理器，共享主存与 I/O</div></div>

          <div class="dg-col"><div class="dg-node leaf">地位对等，经总线/互连网络访问</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">SISD→SIMD→MIMD 是并行度提升路径；多核与 SMP 都属 MIMD，靠<b>多指令流并行</b>提高吞吐率。</div>

  </div></div>`

,

  bus: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">系统总线<small>按传输信息分类</small></div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">数据总线</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">双向，传输数据/指令</div></div>

          <div class="dg-col"><div class="dg-node leaf">位数＝字长</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">地址总线</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">单向，CPU 输出地址</div></div>

          <div class="dg-col"><div class="dg-node leaf">位数决定寻址空间</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">控制总线</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">传输控制/状态/时序信号</div></div>

          <div class="dg-col"><div class="dg-node leaf">最复杂、最能体现总线特性</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">按层次还分<b>片内总线、系统总线、通信总线</b>；总线标准决定时序与电气特性。</div>

  </div></div>`

,

  iomode: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">程序中断方式</div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">特点</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">外设主动向 CPU 发中断请求</div></div>

          <div class="dg-col"><div class="dg-node leaf">CPU 无需轮询等待，效率高于查询</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">流程</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">发请求 → 中断响应（关中断、保存断点）</div></div>

          <div class="dg-col"><div class="dg-node leaf">识别中断源 → 转服务程序 → 恢复现场</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">接口组成</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">INTR 请求、MASK 屏蔽、中断向量</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">与程序查询的区别：<b>主动报告</b> vs <b>被动查询</b>；每个字（或每次事件）传一次中断。</div>

  </div></div>`

,

  dma: `<div class="dg-wrap"><div class="dg">

    <div class="dg-node root">DMA 方式<small>直接存储器存取</small></div>

    <div class="dg-branch">

      <div class="dg-col">

        <div class="dg-node">原理</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">外设与主存之间直接传送数据块</div></div>

          <div class="dg-col"><div class="dg-node leaf">由 DMA 控制器管理，CPU 不干预</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">DMA 接口组成</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">主存地址寄存器 MAR</div></div>

          <div class="dg-col"><div class="dg-node leaf">字计数器 WC</div></div>

          <div class="dg-col"><div class="dg-node leaf">数据缓冲寄存器</div></div>

          <div class="dg-col"><div class="dg-node leaf">DMA 控制逻辑</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">传送过程</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">预处理 → 数据传送 → 后处理</div></div>

        </div>

      </div>

      <div class="dg-col">

        <div class="dg-node">访存冲突处理</div>

        <div class="dg-branch">

          <div class="dg-col"><div class="dg-node leaf">停止 CPU 访存</div></div>

          <div class="dg-col"><div class="dg-node leaf">周期挪用</div></div>

          <div class="dg-col"><div class="dg-node leaf">交替访问</div></div>

        </div>

      </div>

    </div>

    <div class="dg-note">DMA 与中断：DMA 以<b>数据块</b>为单位、由硬件完成传送，仅在块传送结束才中断 CPU 一次。</div>

  </div></div>`

};



/* 考频数据：408 来自历年真题小节考频表(@Yoken怀古)，数学来自 87-26 真题考频统计(为你代研)。
   lv 1低频/2中频/3高频，p 排序分，tag 徽标文案，tip 悬停说明 */

Object.assign(globalThis, { DIAGRAMS });
export { DIAGRAMS };
