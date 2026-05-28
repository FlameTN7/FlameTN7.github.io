---
title: Rabi-Ribi BBH丽塔图文讲解
published: 2026-05-28
updated: 2026-05-28
description: 避弹向应对丽塔的行动模式
tags:
  - 
---

# **Rabi-Ribi BBH丽塔图文讲解**
:::tip
适用于帮助牢玩家们更好地理解丽塔，并提供一些实用的避弹技巧和输出方法。
<br>
<br>
本篇针对的环境是`Bex Bunny Hell`。
<br>

:::
---
## **行动模式**
在高速攻防的BBH环境下，如要进行避弹或输出，首先需要理解丽塔的行动模式，以便更好地应对各种攻击。

### **开局**
丽塔在开局时唯三的招式。
<br>
同时这三招也是常驻全局的随机招式，皆为`自机狙`。

`分裂雪花`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/aca4734480eae4d1d019c886257c10bc0dccde7a51a1085a9fd3d7a64cdc42cf.gif)
<br>
与丽塔保持一点距离开始微移，一般来说两轮莉波射击的时间（点射快速打满）过后，丽塔会重新进入自由行动状态，此时走锤起手单里3c再于落点双下锤（次一点就是下上锤）即可，莉波蓝蓄力能够延长对方恢复行动前的硬直。

:::info
这套连招是整场战斗的基本输出手法。此外，摸清后可以在正确的招式间隙抓准时机穿插双里三下锤提高输出。
:::
:::danger
注意，如需连续抓Boss不脱控，走锤起手应不超过两次下锤，站立双里可以三次，这是由Ch1后的Drill计数器机制决定的。
:::


`光圈狙`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/a735aff30eebf2c90cc122d8e58de8b2514b8c38634d5516ed02ea66c31c33d4.gif)
<br>
单看是送的，但在BH的高速环境下是恶心的随机招式，零帧起手是常态，防不胜防。
<br>
此招不清除硬直抵抗，不建议在这招结束后立即抢输出，在随机期间每次连招结束后不宜进行大跨度的X轴移动，除非你知道下一招是什么，否则易撞体术。

`雪花阵`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/13b26d134a7e92be1f7bb6eb7bb8cb70f7d639d22759899844646fa32ce98fa3.gif)

雪花生成完毕后抓一套，注意雪花生成结束前打上去会卡肉。有时也不一定要抓身后落点，速降拉近再下锤也是可以的。



---
### 10%血线
:::tip 新招式`下扔`加入
![](https://img.flametn7.cc.cd/2026/05/28/2f08bb5a47a949ae97d240902f7617e1644639f76e59c7584ece5abc085a65b9.gif)
<br>
适当拉开距离防止体术，丽塔起跳后回头速降抵近，躲避下扔的弹幕。
:::

从现在开始进入一个循环阶段，我们称之为`Cycle1`，招式顺序如下：
```mermaid
graph LR
    Throw[下扔] --> Rand1[随机招式 1]
    Rand1 --> Rand2[随机招式 2]
    Rand2 -.->|循环| Throw
```
---
### 20%血线
:::tip 新招式`拖尾弹跳雪花`加入
![](https://img.flametn7.cc.cd/2026/05/28/3e02dfb1f90fe0e0518a180256c4107afca9bd4475e387a4d3d80073932df41b.gif)
:::

行动模式仍然是Cycle1，拖尾弹跳雪花从此时开始加入常驻随机库，此招同样不清除硬直抵抗，且极易与其他招式重叠，吃运气和随机应变。如果避弹条件允许，可以向丽塔落点靠近。
<br>
<br>
比起避弹，更建议的是把输出做好，减少这招出现的可能性。

---
### 27.5%血线
:::tip 新招式加入`下踢`加入
![](https://img.flametn7.cc.cd/2026/05/28/1b0bdf3f234b3ba073e022ac57211f4e526ba5038ccd221d83e3d9c7c3a3eb66.gif)
:::

行动模式仍然是Cycle1，下踢可替代下扔。
进入此阶段时必定先触发下踢，此后永久加入Cycle1，与下扔`交替`出现。

---
### 34%血线
:::tip 三个新招式加入
`激光`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/73c3877a75371ec90c983c772665067168c9805a010dab0440dd7ce8a21037dd.gif)
<br>
激光柱首次缩小时进入内部，稍等片刻打双里控制，随后立即速降前进至另一侧再抓一套。
<br>
此处稍顿片刻是为了能控到放完招的丽塔，否则过早判定会清除硬直导致脱控。
<br>
<br>
`雪崩+扇子`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/6ae03b08b7ecc30cc8f93315e34c0f80aaa8091d0f13c49d89754d784aac33c7.gif)
<br>
应对策略与分裂雪花或雪花阵类似
:::

进入此阶段，我们称之为`Cycle2`，不过这个阶段在输出足够的情况下循环存在感不强。
<br>
<br>
出招遵循固定顺序：
```mermaid
flowchart LR
    Laser[激光] --> C1a[Cycle1<br/>下扔/踢 + 双随机]
    C1a --> Aval[雪崩]
    Aval --> Fan[扇子]
    Fan --> C1b[Cycle1<br/>下扔/踢 + 双随机]
    C1b -.->|循环| Laser
```

内部cycle1独立运行，无覆盖关系

---
### 50%血线
:::tip 两个新招式加入
`封位阵`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/571b3b565026d9ef6c0828ce2ca2e23176d37d88e221bc960fe1b7f8b491b474.gif)
<br>
锤子防止收招体术
<br>
<br>
`三连雪崩`
<br>
<br>
![](https://img.flametn7.cc.cd/2026/05/28/7dc9c0a909d246c52758a5fb5179a0cc5803de9ccbf1e6fafb26d3c780bd23ee.gif)
<br>
:请输入文本
<br>
<br>
从版边开始引雪崩，剩下的加油吧，实战几乎就是必吃榜。
:::

进入该阶段立即进行`立绘攻击`（狙+底力交叉弹，就不放了），此后遵循固定顺序：

```mermaid
flowchart TD
    subgraph A [ ]
        direction LR
        a1[三连激光] --> a2[封位阵] --> a3[二连光圈狙]
    end
    subgraph B [ ]
        direction LR
        b1[三连雪崩] --> b2[扇子] --> b3[三连分裂雪花] --> b4[封位阵]
    end
    A --> B
    subgraph C [ ]
        direction LR
        c1[下扔] --> c2[下踢] --> c3[下扔]
    end
    B --> C
    D[扇子]
    C --> D
    subgraph E [ ]
        direction LR
        e1[下踢] --> e2[下扔] --> e3[下踢]
    end
    D --> E
    subgraph F [ ]
        direction LR
        f1[封位阵] --> f2[三连雪崩] --> f3[三连全招式随机]
    end
    E --> F
    G[无限封位阵...]
    F --> G

    style D fill:#fff3cd,stroke:#ffc107,color:#000
    style f3 fill:#fff3cd,stroke:#ffc107,color:#000
   
```
### 额外建议
:::info
在条件允许的情况下，各阶段`血线前`可以有意识地控制输出和对方招式节奏，尽量让伤害溢出到下一个阶段以降低随机性，并提高通过率。尤其对符后有重大意义，能少糟一招是一招。
:::
:::info
吃药时机一般选在封位阵起手前。
:::
## 参考视频
BH避弹项目首创者-Rivica的丽塔篇：
<br>
https://youtu.be/Di0REPJepPA?si=Uic7fIf7UTVIZplV
<br>
<br>
模仿者一号-超级高手DDV的片：
<br>
https://www.bilibili.com/video/BV1ftzvBtEAS
<br>
<br>
模仿者二号-什么是我啊，太菜就不特地放了。
<br>
<br>
希望下一员或下N员是你哦。![](https://img.flametn7.cc.cd/2026/05/28/6b95ef415ec2914ab51021396133c8c1e82bbfb8383fa2f797ae292d6028d2f7.jpg)