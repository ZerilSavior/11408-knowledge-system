// 模块: code50（408代码题预测50题独立打卡，题目/答案分离，做完才看答案）

const CODE50_GROUPS = [
  {name:"图类", start:0, end:13, color:"#0a8a5f", bg:"#e3f6ee"},
  {name:"链表类", start:13, end:23, color:"#1565c0", bg:"#e3f2fd"},
  {name:"二叉树类", start:23, end:35, color:"#7b1fa2", bg:"#f3e5f5"},
  {name:"顺序表/数组类", start:35, end:50, color:"#c2560a", bg:"#fff0e2"}
];

const CODE50_DATA = [
  {n:1,stars:"⭐⭐",title:'欧拉路径判定（2021真题变形）',problem:'无向连通图G采用邻接矩阵存储，判断G是否存在欧拉路径（EL路径）。若存在返回1，否则返回0。',code:'typedef struct {\n    int numVertices, numEdges;\n    char VerticesList[MAXV];\n    int Edge[MAXV][MAXV];\n} MGraph;\n\nint IsEulerPath(MGraph G) {\n    int oddCount = 0;\n    for (int i = 0; i < G.numVertices; i++) {\n        int degree = 0;\n        for (int j = 0; j < G.numVertices; j++)\n            degree += G.Edge[i][j];\n        if (degree % 2 == 1) oddCount++;\n    }\n    return (oddCount == 0 || oddCount == 2) ? 1 : 0;\n}',complexity:'O(V²) 时间，O(1) 空间'},
  {n:2,stars:"⭐",title:'输出K顶点（2023真题）',problem:'有向图中，出度大于入度的顶点称为K顶点。输出所有K顶点并返回个数。',code:'int printKVertices(MGraph G) {\n    int count = 0;\n    for (int i = 0; i < G.numVertices; i++) {\n        int inDeg = 0, outDeg = 0;\n        for (int j = 0; j < G.numVertices; j++) {\n            outDeg += G.Edge[i][j];  // 第i行是出度\n            inDeg  += G.Edge[j][i];  // 第i列是入度\n        }\n        if (outDeg > inDeg) {\n            printf("顶点%c是K顶点\\n", G.VerticesList[i]);\n            count++;\n        }\n    }\n    return count;\n}',complexity:'O(V²) 时间，O(1) 空间'},
  {n:3,stars:"⭐⭐",title:'判断有向图是否有环（拓扑排序应用）',problem:'邻接矩阵存储的有向图，判断是否存在环。有环返回1，无环返回0。',code:'int hasCycle(MGraph G) {\n    int indegree[MAXV] = {0};\n    // 计算入度\n    for (int i = 0; i < G.numVertices; i++)\n        for (int j = 0; j < G.numVertices; j++)\n            if (G.Edge[i][j] == 1) indegree[j]++;\n    \n    int queue[MAXV], front = 0, rear = 0;\n    for (int i = 0; i < G.numVertices; i++)\n        if (indegree[i] == 0) queue[rear++] = i;\n    \n    int visited = 0;\n    while (front < rear) {\n        int u = queue[front++];\n        visited++;\n        for (int v = 0; v < G.numVertices; v++) {\n            if (G.Edge[u][v] == 1) {\n                indegree[v]--;\n                if (indegree[v] == 0) queue[rear++] = v;\n            }\n        }\n    }\n    return visited < G.numVertices ? 1 : 0;  // 未访问完全部顶点=有环\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:4,stars:"⭐⭐",title:'拓扑序列唯一性判定（2024真题）',problem:'判定有向图G是否存在唯一的拓扑序列。唯一返回1，否则返回0。',code:'int uniquely(MGraph G) {\n    int indegree[MAXV] = {0};\n    for (int i = 0; i < G.numVertices; i++)\n        for (int j = 0; j < G.numVertices; j++)\n            if (G.Edge[i][j] == 1) indegree[j]++;\n    \n    for (int k = 0; k < G.numVertices; k++) {\n        int count0 = 0, v0 = -1;\n        for (int i = 0; i < G.numVertices; i++) {\n            if (indegree[i] == 0) { count0++; v0 = i; }\n        }\n        if (count0 != 1) return 0;  // 同时有多个入度为0→不唯一\n        indegree[v0] = -1;\n        for (int j = 0; j < G.numVertices; j++)\n            if (G.Edge[v0][j] == 1) indegree[j]--;\n    }\n    return 1;\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:5,stars:"⭐⭐",title:'输出拓扑排序序列',problem:'输出有向图的一个拓扑序列，存入数组topo中，返回序列长度。',code:'int topoSort(MGraph G, int topo[]) {\n    int indegree[MAXV] = {0};\n    for (int i = 0; i < G.numVertices; i++)\n        for (int j = 0; j < G.numVertices; j++)\n            if (G.Edge[i][j] == 1) indegree[j]++;\n    \n    int stack[MAXV], top = -1;\n    for (int i = 0; i < G.numVertices; i++)\n        if (indegree[i] == 0) stack[++top] = i;\n    \n    int count = 0;\n    while (top != -1) {\n        int u = stack[top--];\n        topo[count++] = u;\n        for (int v = 0; v < G.numVertices; v++) {\n            if (G.Edge[u][v] == 1) {\n                if (--indegree[v] == 0) stack[++top] = v;\n            }\n        }\n    }\n    return count;  // < numVertices 说明有环\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:6,stars:"⭐⭐",title:'BFS求无权图最短路径',problem:'邻接矩阵无向图，求从顶点v到其余各顶点的最短路径长度（边数），存入dist数组。',code:'void BFS_ShortestPath(MGraph G, int v, int dist[]) {\n    for (int i = 0; i < G.numVertices; i++) dist[i] = -1;\n    int queue[MAXV], front = 0, rear = 0;\n    dist[v] = 0;\n    queue[rear++] = v;\n    while (front < rear) {\n        int u = queue[front++];\n        for (int w = 0; w < G.numVertices; w++) {\n            if (G.Edge[u][w] != 0 && dist[w] == -1) {\n                dist[w] = dist[u] + 1;\n                queue[rear++] = w;\n            }\n        }\n    }\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:7,stars:"⭐⭐",title:'DFS求连通分量个数',problem:'无向邻接矩阵图，求连通分量个数。',code:'void DFS(MGraph G, int v, bool visited[]) {\n    visited[v] = true;\n    for (int w = 0; w < G.numVertices; w++)\n        if (G.Edge[v][w] != 0 && !visited[w])\n            DFS(G, w, visited);\n}\n\nint countComponents(MGraph G) {\n    bool visited[MAXV] = {false};\n    int count = 0;\n    for (int v = 0; v < G.numVertices; v++) {\n        if (!visited[v]) {\n            DFS(G, v, visited);\n            count++;\n        }\n    }\n    return count;\n}',complexity:'O(V²) 时间，O(V) 递归栈空间'},
  {n:8,stars:"⭐⭐⭐",title:'DFS判断路径是否存在',problem:'有向图邻接矩阵，判断从顶点u到顶点v是否存在路径。存在返回true。',code:'bool visited[MAXV];\n\nbool DFS_path(MGraph G, int u, int v) {\n    if (u == v) return true;\n    visited[u] = true;\n    for (int w = 0; w < G.numVertices; w++) {\n        if (G.Edge[u][w] != 0 && !visited[w]) {\n            if (DFS_path(G, w, v)) return true;\n        }\n    }\n    return false;\n}\n\nbool hasPath(MGraph G, int u, int v) {\n    memset(visited, 0, sizeof(visited));\n    return DFS_path(G, u, v);\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:9,stars:"⭐⭐⭐",title:'Prim最小生成树',problem:'带权连通无向图邻接矩阵，用Prim算法求MST的总权值。',code:'int Prim(MGraph G, int start) {\n    int lowcost[MAXV];\n    bool visited[MAXV] = {false};\n    for (int i = 0; i < G.numVertices; i++)\n        lowcost[i] = G.Edge[start][i];\n    visited[start] = true;\n    int totalWeight = 0;\n    for (int k = 1; k < G.numVertices; k++) {\n        int min = INF, v = -1;\n        for (int i = 0; i < G.numVertices; i++)\n            if (!visited[i] && lowcost[i] < min) {\n                min = lowcost[i]; v = i;\n            }\n        if (v == -1) break;\n        visited[v] = true;\n        totalWeight += min;\n        for (int j = 0; j < G.numVertices; j++)\n            if (!visited[j] && G.Edge[v][j] < lowcost[j])\n                lowcost[j] = G.Edge[v][j];\n    }\n    return totalWeight;\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:10,stars:"⭐⭐⭐",title:'Dijkstra最短路径',problem:'带权有向图（权值非负）邻接矩阵，求从v0到其余各点最短路径长度。',code:'void Dijkstra(MGraph G, int v0, int dist[]) {\n    bool visited[MAXV] = {false};\n    for (int i = 0; i < G.numVertices; i++)\n        dist[i] = G.Edge[v0][i];\n    visited[v0] = true;\n    for (int k = 1; k < G.numVertices; k++) {\n        int min = INF, u = -1;\n        for (int i = 0; i < G.numVertices; i++)\n            if (!visited[i] && dist[i] < min) {\n                min = dist[i]; u = i;\n            }\n        if (u == -1) break;\n        visited[u] = true;\n        for (int j = 0; j < G.numVertices; j++)\n            if (!visited[j] && dist[u] + G.Edge[u][j] < dist[j])\n                dist[j] = dist[u] + G.Edge[u][j];\n    }\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:11,stars:"⭐⭐",title:'判断图是否为树',problem:'无向图邻接矩阵，判断是否为一棵树（连通且无环，边数=顶点数-1）。',code:'int isTree(MGraph G) {\n    // 条件1：边数 = 顶点数 - 1\n    if (G.numEdges != G.numVertices - 1) return 0;\n    // 条件2：连通（DFS能访问所有顶点）\n    bool visited[MAXV] = {false};\n    DFS(G, 0, visited);\n    for (int i = 0; i < G.numVertices; i++)\n        if (!visited[i]) return 0;\n    return 1;\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:12,stars:"⭐⭐",title:'统计入度/出度并输出',problem:'有向图邻接矩阵，计算每个顶点的入度和出度，输出度数之和为奇数的顶点个数。',code:'int countOddDegree(MGraph G) {\n    int count = 0;\n    for (int i = 0; i < G.numVertices; i++) {\n        int inDeg = 0, outDeg = 0;\n        for (int j = 0; j < G.numVertices; j++) {\n            outDeg += G.Edge[i][j];\n            inDeg  += G.Edge[j][i];\n        }\n        if ((inDeg + outDeg) % 2 == 1) count++;\n    }\n    return count;\n}',complexity:'O(V²) 时间，O(1) 空间'},
  {n:13,stars:"⭐⭐⭐",title:'BFS求从起点到终点的最短路径（记录路径）',problem:'无权无向图，求从s到t的最短路径，将路径顶点存入path数组，返回路径长度。',code:'int BFS_Path(MGraph G, int s, int t, int path[]) {\n    int dist[MAXV], prev[MAXV];\n    bool visited[MAXV] = {false};\n    int queue[MAXV], front = 0, rear = 0;\n    for (int i = 0; i < G.numVertices; i++) { dist[i] = -1; prev[i] = -1; }\n    dist[s] = 0;\n    visited[s] = true;\n    queue[rear++] = s;\n    while (front < rear) {\n        int u = queue[front++];\n        if (u == t) break;\n        for (int v = 0; v < G.numVertices; v++) {\n            if (G.Edge[u][v] != 0 && !visited[v]) {\n                visited[v] = true;\n                dist[v] = dist[u] + 1;\n                prev[v] = u;\n                queue[rear++] = v;\n            }\n        }\n    }\n    if (dist[t] == -1) return 0;  // 不可达\n    // 反向构建路径\n    int len = 0, cur = t;\n    while (cur != -1) { path[len++] = cur; cur = prev[cur]; }\n    // 反转\n    for (int i = 0; i < len / 2; i++) {\n        int tmp = path[i]; path[i] = path[len-1-i]; path[len-1-i] = tmp;\n    }\n    return len;\n}',complexity:'O(V²) 时间，O(V) 空间'},
  {n:14,stars:"⭐",title:'查找倒数第k个结点（2009真题）',problem:'带头结点单链表，查找倒数第k个结点并输出其data。一趟遍历。',code:'typedef struct LNode {\n    int data;\n    struct LNode *next;\n} LNode, *LinkList;\n\nint findKthFromTail(LinkList L, int k) {\n    LNode *p = L->next, *q = L->next;\n    int count = 0;\n    while (p != NULL) {\n        if (count < k) count++;\n        else q = q->next;\n        p = p->next;\n    }\n    if (count < k) return -1;  // k超过链表长度\n    return q->data;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:15,stars:"⭐⭐",title:'两个链表第一个公共结点（2012真题）',problem:'两个带头结点单链表（有公共后缀），找公共后缀起始结点。',code:'LNode* findCommonSuffix(LinkList str1, LinkList str2) {\n    int len1 = 0, len2 = 0;\n    LNode *p = str1->next, *q = str2->next;\n    while (p) { len1++; p = p->next; }\n    while (q) { len2++; q = q->next; }\n    p = str1->next; q = str2->next;\n    // 长表先走差值步\n    if (len1 > len2) {\n        for (int i = 0; i < len1 - len2; i++) p = p->next;\n    } else {\n        for (int i = 0; i < len2 - len1; i++) q = q->next;\n    }\n    while (p != q) { p = p->next; q = q->next; }\n    return p;  // NULL表示无公共结点\n}',complexity:'O(len1+len2) 时间，O(1) 空间'},
  {n:16,stars:"⭐⭐⭐",title:'链表重排（2019真题）',problem:'将 L=(a1,a2,...,an) 重排为 (a1,an,a2,an-1,...)，空间O(1)。',code:'void reorderList(LinkList L) {\n    if (!L->next || !L->next->next) return;\n    // 1. 快慢指针找中点\n    LNode *slow = L->next, *fast = L->next;\n    while (fast->next && fast->next->next) {\n        slow = slow->next;\n        fast = fast->next->next;\n    }\n    // 2. 反转后半段\n    LNode *pre = NULL, *curr = slow->next;\n    slow->next = NULL;\n    while (curr) {\n        LNode *next = curr->next;\n        curr->next = pre;\n        pre = curr;\n        curr = next;\n    }\n    // 3. 交替合并\n    LNode *p1 = L->next, *p2 = pre;\n    while (p2) {\n        LNode *next1 = p1->next;\n        LNode *next2 = p2->next;\n        p1->next = p2;\n        p2->next = next1;\n        p1 = next1;\n        p2 = next2;\n    }\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:17,stars:"⭐",title:'快慢指针找链表中点',problem:'带头结点单链表，返回中间结点指针（偶数个时返回偏左的中点）。',code:'LNode* findMiddle(LinkList L) {\n    LNode *slow = L->next, *fast = L->next;\n    while (fast->next && fast->next->next) {\n        slow = slow->next;\n        fast = fast->next->next;\n    }\n    return slow;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:18,stars:"⭐⭐",title:'判断链表是否有环',problem:'判断单链表是否带环。',code:'int hasCycle(LinkList L) {\n    LNode *slow = L->next, *fast = L->next;\n    while (fast && fast->next) {\n        slow = slow->next;\n        fast = fast->next->next;\n        if (slow == fast) return 1;\n    }\n    return 0;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:19,stars:"⭐⭐⭐",title:'找环的入口结点',problem:'若链表有环，返回环的入口结点；无环返回NULL。',code:'LNode* findCycleEntry(LinkList L) {\n    LNode *slow = L->next, *fast = L->next;\n    int hasC = 0;\n    while (fast && fast->next) {\n        slow = slow->next;\n        fast = fast->next->next;\n        if (slow == fast) { hasC = 1; break; }\n    }\n    if (!hasC) return NULL;\n    // 一个指针从头出发，两指针同步走，相遇点即入口\n    slow = L->next;\n    while (slow != fast) {\n        slow = slow->next;\n        fast = fast->next;\n    }\n    return slow;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:20,stars:"⭐⭐",title:'链表删除绝对值重复结点（2015真题）',problem:'单链表存m个整数，|data|≤n，删除绝对值重复的结点，仅保留第一次出现的。',code:'void removeDupAbs(LinkList L, int n) {\n    bool *visited = new bool[n + 1]();  // 0初始化\n    LNode *p = L;\n    while (p->next) {\n        int absVal = p->next->data >= 0 ? p->next->data : -(p->next->data);\n        if (visited[absVal]) {\n            LNode *del = p->next;\n            p->next = del->next;\n            delete del;\n        } else {\n            visited[absVal] = true;\n            p = p->next;\n        }\n    }\n    delete[] visited;\n}',complexity:'O(m) 时间，O(n) 空间'},
  {n:21,stars:"⭐",title:'反转单链表（迭代法）',problem:'原地反转带头结点单链表。',code:'void reverseList(LinkList L) {\n    LNode *pre = NULL, *curr = L->next;\n    while (curr) {\n        LNode *next = curr->next;\n        curr->next = pre;\n        pre = curr;\n        curr = next;\n    }\n    L->next = pre;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:22,stars:"⭐⭐",title:'合并两个有序单链表',problem:'两个升序带头结点单链表，合并为一个升序链表（复用原结点）。',code:'LinkList mergeTwoLists(LinkList A, LinkList B) {\n    LNode *p = A->next, *q = B->next;\n    LNode *head = A, *tail = A;\n    while (p && q) {\n        if (p->data <= q->data) {\n            tail->next = p; p = p->next;\n        } else {\n            tail->next = q; q = q->next;\n        }\n        tail = tail->next;\n    }\n    tail->next = p ? p : q;\n    delete B;  // 释放B的头结点\n    return A;\n}',complexity:'O(m+n) 时间，O(1) 空间'},
  {n:23,stars:"⭐⭐",title:'判断链表是否为回文',problem:'判断单链表元素序列是否回文。',code:'int isPalindrome(LinkList L) {\n    LNode *slow = L->next, *fast = L->next;\n    while (fast->next && fast->next->next) {\n        slow = slow->next;\n        fast = fast->next->next;\n    }\n    // 反转后半段\n    LNode *pre = NULL, *curr = slow->next;\n    while (curr) {\n        LNode *next = curr->next;\n        curr->next = pre; pre = curr; curr = next;\n    }\n    // 比较\n    LNode *p = L->next, *q = pre;\n    while (q) {\n        if (p->data != q->data) return 0;\n        p = p->next; q = q->next;\n    }\n    return 1;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:24,stars:"⭐⭐",title:'求二叉树带权路径长度WPL（2014真题）',problem:'二叉链表存储，叶子结点weight域存权值，求WPL。',code:'typedef struct BiTNode {\n    int weight;\n    struct BiTNode *lchild, *rchild;\n} BiTNode, *BiTree;\n\nint WPL(BiTree T, int depth) {\n    if (!T) return 0;\n    if (!T->lchild && !T->rchild)  // 叶子结点\n        return T->weight * depth;\n    return WPL(T->lchild, depth + 1) + WPL(T->rchild, depth + 1);\n}\n\nint getWPL(BiTree T) {\n    return WPL(T, 0);  // 根结点深度为0\n}',complexity:'O(n) 时间，O(h) 递归栈空间'},
  {n:25,stars:"⭐⭐⭐",title:'表达式树转中缀表达式（2017真题）',problem:'表达式树输出等价中缀表达式，通过括号反映运算次序。',code:'typedef struct ETNode {\n    char data[10];\n    struct ETNode *lchild, *rchild;\n} ETNode, *ETree;\n\nvoid inorder(ETree T) {\n    if (!T) return;\n    if (!T->lchild && !T->rchild) {\n        // 叶子：操作数直接输出\n        printf("%s", T->data);\n        return;\n    }\n    // 非叶子：加括号\n    printf("(");\n    inorder(T->lchild);\n    printf("%s", T->data);\n    inorder(T->rchild);\n    printf(")");\n}\n\nvoid printInfix(ETree T) {\n    inorder(T);\n    printf("\\n");\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:26,stars:"⭐⭐",title:'判断二叉树是否为BST（2022真题）',problem:'顺序存储二叉树，判定是否为二叉搜索树。',code:'typedef struct {\n    int SqBiTNode[MAX_SIZE];\n    int ElemNum;\n} SqBiTree;\n\nbool isBST(SqBiTree T, int index, int minVal, int maxVal) {\n    if (index >= T.ElemNum) return true;\n    int val = T.SqBiTNode[index];\n    if (val <= minVal || val >= maxVal) return false;\n    return isBST(T, 2*index+1, minVal, val) &&\n           isBST(T, 2*index+2, val, maxVal);\n}\n\nbool checkBST(SqBiTree T) {\n    if (T.ElemNum == 0) return true;\n    return isBST(T, 0, INT_MIN, INT_MAX);\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:27,stars:"⭐⭐⭐",title:'BST中查找与K差最小的结点（2026真题）',problem:'BST中查找与整数K之差绝对值最小的所有结点。',code:'typedef struct BSTNode {\n    int data;\n    struct BSTNode *left, *right;\n} BSTNode;\n\nint minDiff = INT_MAX;\nBSTNode* resultList[MAX_SIZE];\nint resultCount = 0;\n\nvoid searchMinDiff(BSTNode* T, int K) {\n    if (!T) return;\n    int diff = abs(T->data - K);\n    if (diff < minDiff) {\n        minDiff = diff;\n        resultCount = 0;\n        resultList[resultCount++] = T;\n    } else if (diff == minDiff) {\n        resultList[resultCount++] = T;\n    }\n    // BST剪枝：K<当前值优先搜左子树\n    if (K < T->data) {\n        searchMinDiff(T->left, K);\n        if (minDiff != 0) searchMinDiff(T->right, K);\n    } else if (K > T->data) {\n        searchMinDiff(T->right, K);\n        if (minDiff != 0) searchMinDiff(T->left, K);\n    }\n}',complexity:'平衡树O(log n)，最坏O(n) 时间，O(log n) 空间'},
  {n:28,stars:"⭐",title:'求二叉树高度',problem:'二叉链表，求树的高度（层数）。',code:'int height(BiTree T) {\n    if (!T) return 0;\n    int lh = height(T->lchild);\n    int rh = height(T->rchild);\n    return (lh > rh ? lh : rh) + 1;\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:29,stars:"⭐",title:'统计叶子结点个数',problem:'二叉链表，求叶子结点总数。',code:'int countLeaves(BiTree T) {\n    if (!T) return 0;\n    if (!T->lchild && !T->rchild) return 1;\n    return countLeaves(T->lchild) + countLeaves(T->rchild);\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:30,stars:"⭐⭐",title:'层序遍历（BFS）',problem:'二叉链表，按层序遍历输出结点值。',code:'void levelOrder(BiTree T) {\n    if (!T) return;\n    BiTree queue[MAX_SIZE];\n    int front = 0, rear = 0;\n    queue[rear++] = T;\n    while (front < rear) {\n        BiTree node = queue[front++];\n        printf("%d ", node->weight);\n        if (node->lchild) queue[rear++] = node->lchild;\n        if (node->rchild) queue[rear++] = node->rchild;\n    }\n}',complexity:'O(n) 时间，O(n) 空间'},
  {n:31,stars:"⭐⭐",title:'求根到叶子路径之和',problem:'二叉树每个结点存数字，求所有根到叶子路径代表数字之和。\n（如根1左2右3 → 12+13=25）',code:'int sumNumbers(BiTree T, int current) {\n    if (!T) return 0;\n    current = current * 10 + T->weight;\n    if (!T->lchild && !T->rchild) return current;\n    return sumNumbers(T->lchild, current) + sumNumbers(T->rchild, current);\n}\n\nint getSum(BiTree T) {\n    return sumNumbers(T, 0);\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:32,stars:"⭐⭐⭐",title:'最近公共祖先',problem:'二叉树中找p和q的最近公共祖先。',code:'BiTree lowestCommonAncestor(BiTree root, BiTree p, BiTree q) {\n    if (!root || root == p || root == q) return root;\n    BiTree left = lowestCommonAncestor(root->lchild, p, q);\n    BiTree right = lowestCommonAncestor(root->rchild, p, q);\n    if (left && right) return root;       // p,q分别在左右 → root是LCA\n    return left ? left : right;            // 都在一侧\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:33,stars:"⭐",title:'翻转二叉树',problem:'递归翻转二叉树（左右子树交换）。',code:'void invertTree(BiTree T) {\n    if (!T) return;\n    BiTree tmp = T->lchild;\n    T->lchild = T->rchild;\n    T->rchild = tmp;\n    invertTree(T->lchild);\n    invertTree(T->rchild);\n}',complexity:'O(n) 时间，O(h) 空间'},
  {n:34,stars:"⭐⭐",title:'求二叉树宽度（最宽层结点数）',problem:'层序遍历，求同一层最多结点数。',code:'int maxWidth(BiTree T) {\n    if (!T) return 0;\n    BiTree queue[MAX_SIZE];\n    int front = 0, rear = 0;\n    queue[rear++] = T;\n    int maxW = 0;\n    while (front < rear) {\n        int levelSize = rear - front;\n        if (levelSize > maxW) maxW = levelSize;\n        for (int i = 0; i < levelSize; i++) {\n            BiTree node = queue[front++];\n            if (node->lchild) queue[rear++] = node->lchild;\n            if (node->rchild) queue[rear++] = node->rchild;\n        }\n    }\n    return maxW;\n}',complexity:'O(n) 时间，O(n) 空间'},
  {n:35,stars:"⭐⭐⭐",title:'由前序+中序重建二叉树',problem:'给定前序序列pre和中序序列in，重建二叉树并返回根指针。',code:'BiTree buildTree(int pre[], int in[], int preStart, int preEnd,\n                 int inStart, int inEnd) {\n    if (preStart > preEnd) return NULL;\n    BiTree root = new BiTree;\n    root->weight = pre[preStart];\n    root->lchild = root->rchild = NULL;\n    // 在中序中找根位置\n    int rootIdx = inStart;\n    while (in[rootIdx] != pre[preStart]) rootIdx++;\n    int leftSize = rootIdx - inStart;\n    root->lchild = buildTree(pre, in, preStart+1, preStart+leftSize,\n                             inStart, rootIdx-1);\n    root->rchild = buildTree(pre, in, preStart+leftSize+1, preEnd,\n                             rootIdx+1, inEnd);\n    return root;\n}',complexity:'O(n²) 最坏（找根），O(n log n) 平均；空间O(h)'},
  {n:36,stars:"⭐",title:'数组循环左移（2010真题）',problem:'长度n的数组循环左移p位，空间O(1)。',code:'void reverse(int a[], int low, int high) {\n    while (low < high) {\n        int tmp = a[low]; a[low] = a[high]; a[high] = tmp;\n        low++; high--;\n    }\n}\n\nvoid rotateLeft(int a[], int n, int p) {\n    reverse(a, 0, p - 1);\n    reverse(a, p, n - 1);\n    reverse(a, 0, n - 1);\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:37,stars:"⭐⭐⭐",title:'两个等长升序序列中位数（2011真题）',problem:'两个等长升序数组A、B，求合并后的中位数，O(log n)。',code:'int findMedian(int A[], int B[], int n) {\n    int s1 = 0, e1 = n - 1, s2 = 0, e2 = n - 1;\n    while (s1 < e1) {\n        int m1 = (s1 + e1) / 2, m2 = (s2 + e2) / 2;\n        int k1 = e1 - s1 + 1, k2 = e2 - s2 + 1;\n        if (A[m1] == B[m2]) return A[m1];\n        if (A[m1] < B[m2]) {\n            s1 = m1 + (k1 % 2 == 0 ? 1 : 0);\n            e2 = m2;\n        } else {\n            s2 = m2 + (k2 % 2 == 0 ? 1 : 0);\n            e1 = m1;\n        }\n    }\n    return A[s1] < B[s2] ? A[s1] : B[s2];\n}',complexity:'O(log n) 时间，O(1) 空间'},
  {n:38,stars:"⭐⭐",title:'摩尔投票法找主元素（2013真题）',problem:'数组中出现次数超过n/2的元素称为主元素，判断是否存在。',code:'int findMajority(int a[], int n) {\n    int candidate = a[0], count = 1;\n    for (int i = 1; i < n; i++) {\n        if (a[i] == candidate) count++;\n        else count--;\n        if (count == 0) {\n            candidate = a[i];\n            count = 1;\n        }\n    }\n    // 验证\n    int cnt = 0;\n    for (int i = 0; i < n; i++)\n        if (a[i] == candidate) cnt++;\n    return cnt > n / 2 ? candidate : -1;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:39,stars:"⭐⭐⭐",title:'集合划分（2016真题）',problem:'将正整数集合划分为两个子集，使元素个数差最小且元素和差最大。快速选择思想。',code:'int partition(int a[], int low, int high) {\n    int pivot = a[low];\n    while (low < high) {\n        while (low < high && a[high] >= pivot) high--;\n        a[low] = a[high];\n        while (low < high && a[low] <= pivot) low++;\n        a[high] = a[low];\n    }\n    a[low] = pivot;\n    return low;\n}\n\nvoid divideArray(int a[], int n, int target) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int pivotPos = partition(a, low, high);\n        if (pivotPos == target - 1) break;\n        else if (pivotPos < target - 1) low = pivotPos + 1;\n        else high = pivotPos - 1;\n    }\n    // a[0..target-1]为一组，a[target..n-1]为另一组\n}',complexity:'平均O(n) 时间，最坏O(n²)；O(1) 空间'},
  {n:40,stars:"⭐⭐⭐",title:'最小未出现正整数（2018真题）',problem:'无序整数数组，找最小的未出现正整数，O(n)时间O(1)空间。',code:'int firstMissingPositive(int a[], int n) {\n    // 将每个数放到它该在的位置（i位置放值i+1）\n    for (int i = 0; i < n; i++) {\n        while (a[i] > 0 && a[i] <= n && a[a[i] - 1] != a[i]) {\n            int tmp = a[a[i] - 1];\n            a[a[i] - 1] = a[i];\n            a[i] = tmp;\n        }\n    }\n    for (int i = 0; i < n; i++)\n        if (a[i] != i + 1) return i + 1;\n    return n + 1;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:41,stars:"⭐⭐⭐",title:'三元组最小距离（2020真题）',problem:'三个升序数组S1,S2,S3，求所有三元组的最小距离。',code:'#include <climits>\nint minDistance(int S1[], int n1, int S2[], int n2, int S3[], int n3) {\n    int i = 0, j = 0, k = 0;\n    int minDist = INT_MAX;\n    while (i < n1 && j < n2 && k < n3) {\n        int a = S1[i], b = S2[j], c = S3[k];\n        int dist = abs(a-b) + abs(b-c) + abs(c-a);\n        if (dist < minDist) minDist = dist;\n        // 移动最小元素的指针\n        if (a <= b && a <= c) i++;\n        else if (b <= a && b <= c) j++;\n        else k++;\n    }\n    return minDist;\n}',complexity:'O(n1+n2+n3) 时间，O(1) 空间'},
  {n:42,stars:"⭐⭐",title:'乘积最大值（2025真题）',problem:'数组A中求所有A[i]*A[j](i≤j)最大值，存入res[i]。',code:'void calMulMax(int A[], int res[], int n) {\n    int maxVal = A[0], minVal = A[0];\n    for (int i = 1; i < n; i++) {\n        if (A[i] > maxVal) maxVal = A[i];\n        if (A[i] < minVal) minVal = A[i];\n    }\n    for (int i = 0; i < n; i++) {\n        if (A[i] >= 0) res[i] = A[i] * maxVal;\n        else res[i] = A[i] * minVal;\n    }\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:43,stars:"⭐⭐",title:'二分查找：旋转有序数组找目标',problem:'旋转升序数组（如[4,5,6,7,0,1,2]），二分查找目标值。',code:'int search(int a[], int n, int target) {\n    int low = 0, high = n - 1;\n    while (low <= high) {\n        int mid = (low + high) / 2;\n        if (a[mid] == target) return mid;\n        if (a[low] <= a[mid]) {  // 左半有序\n            if (a[low] <= target && target < a[mid]) high = mid - 1;\n            else low = mid + 1;\n        } else {  // 右半有序\n            if (a[mid] < target && target <= a[high]) low = mid + 1;\n            else high = mid - 1;\n        }\n    }\n    return -1;\n}',complexity:'O(log n) 时间，O(1) 空间'},
  {n:44,stars:"⭐",title:'荷兰国旗问题（三向切分）',problem:'数组只含0,1,2，原地排序为所有0在前、1居中、2在后。',code:'void sortColors(int a[], int n) {\n    int low = 0, mid = 0, high = n - 1;\n    while (mid <= high) {\n        if (a[mid] == 0) {\n            int tmp = a[low]; a[low] = a[mid]; a[mid] = tmp;\n            low++; mid++;\n        } else if (a[mid] == 1) {\n            mid++;\n        } else {\n            int tmp = a[mid]; a[mid] = a[high]; a[high] = tmp;\n            high--;\n        }\n    }\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:45,stars:"⭐",title:'移动零',problem:'将数组中所有0移到末尾，保持非零元素相对顺序。',code:'void moveZeros(int a[], int n) {\n    int pos = 0;  // 下一个非零元素放置位置\n    for (int i = 0; i < n; i++) {\n        if (a[i] != 0) {\n            a[pos] = a[i];\n            pos++;\n        }\n    }\n    while (pos < n) a[pos++] = 0;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:46,stars:"⭐",title:'找缺失数字',problem:'含n-1个不重复数字（0~n-1范围），找出缺失的那个数。',code:'int findMissing(int a[], int n) {\n    int expectedSum = (n - 1) * n / 2;\n    int actualSum = 0;\n    for (int i = 0; i < n - 1; i++) actualSum += a[i];\n    return expectedSum - actualSum;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:47,stars:"⭐⭐",title:'找重复数（1~n范围，一个重复）',problem:'长度n+1数组，数字在1~n之间，找出唯一重复数，O(1)空间。',code:'int findDuplicate(int a[], int n) {\n    // 快慢指针（链表环思想）\n    int slow = a[0], fast = a[0];\n    do {\n        slow = a[slow];\n        fast = a[a[fast]];\n    } while (slow != fast);\n    // 找环入口\n    slow = a[0];\n    while (slow != fast) {\n        slow = a[slow];\n        fast = a[fast];\n    }\n    return slow;\n}',complexity:'O(n) 时间，O(1) 空间'},
  {n:48,stars:"⭐⭐",title:'数组中第k大元素',problem:'无序数组中找第k大元素，平均O(n)。',code:'int partition(int a[], int low, int high) {\n    int pivot = a[low];\n    while (low < high) {\n        while (low < high && a[high] <= pivot) high--;\n        a[low] = a[high];\n        while (low < high && a[low] >= pivot) low++;\n        a[high] = a[low];\n    }\n    a[low] = pivot;\n    return low;\n}\n\nint findKthLargest(int a[], int n, int k) {\n    int low = 0, high = n - 1;\n    int target = k - 1;  // 第k大=下标k-1（降序）\n    while (low <= high) {\n        int pos = partition(a, low, high);\n        if (pos == target) return a[pos];\n        else if (pos < target) low = pos + 1;\n        else high = pos - 1;\n    }\n    return -1;\n}',complexity:'平均O(n)，最坏O(n²) 时间，O(1) 空间'},
  {n:49,stars:"⭐⭐",title:'合并两个有序数组',problem:'A有足够空间（长度m+n），合并升序数组B到A中，从后往前。',code:'void mergeSorted(int A[], int m, int B[], int n) {\n    int i = m - 1, j = n - 1, k = m + n - 1;\n    while (i >= 0 && j >= 0) {\n        if (A[i] >= B[j]) A[k--] = A[i--];\n        else A[k--] = B[j--];\n    }\n    while (j >= 0) A[k--] = B[j--];\n}',complexity:'O(m+n) 时间，O(1) 空间'},
  {n:50,stars:"⭐⭐",title:'数组中出现次数超过n/3的元素',problem:'找出数组中所有出现次数超过n/3的元素（最多2个）。',code:'void majorityElement2(int a[], int n) {\n    int c1 = 0, c2 = 0, count1 = 0, count2 = 0;\n    for (int i = 0; i < n; i++) {\n        if (a[i] == c1) count1++;\n        else if (a[i] == c2) count2++;\n        else if (count1 == 0) { c1 = a[i]; count1 = 1; }\n        else if (count2 == 0) { c2 = a[i]; count2 = 1; }\n        else { count1--; count2--; }\n    }\n    count1 = count2 = 0;\n    for (int i = 0; i < n; i++) {\n        if (a[i] == c1) count1++;\n        else if (a[i] == c2) count2++;\n    }\n    if (count1 > n / 3) printf("%d ", c1);\n    if (count2 > n / 3) printf("%d ", c2);\n    printf("\\n");\n}',complexity:'O(n) 时间，O(1) 空间'}
];

function ensureCode50(){
  if(!state.code50||typeof state.code50!=='object') state.code50={start:'',done:{},shown:{}};
  const c=state.code50;
  if(!c.done||typeof c.done!=='object') c.done={};
  if(!c.shown||typeof c.shown!=='object') c.shown={};
  return c;
}

function mergeCode50(local,cloud){
  const l=local||{start:'',done:{},shown:{}};
  const out={start:l.start||(cloud&&cloud.start)||'',done:{},shown:{}};
  const dk=new Set([].concat(Object.keys(l.done||{}),Object.keys((cloud&&cloud.done)||{})));
  dk.forEach(k=>{ const a=(l.done||{})[k], b=(cloud&&cloud.done||{})[k]; out.done[k]=b?b:a; });
  const sk=new Set([].concat(Object.keys(l.shown||{}),Object.keys((cloud&&cloud.shown)||{})));
  sk.forEach(k=>{ const a=(l.shown||{})[k], b=(cloud&&cloud.shown||{})[k]; out.shown[k]=b?b:a; });
  return out;
}

function code50Start(){ const c=ensureCode50(); return c.start || planTodayStr(); }
function code50TodayIdx(){ return planDiff(code50Start(), planTodayStr()); }
function code50DoneN(){ const c=ensureCode50(); let n=0; Object.keys(c.done).forEach(k=>{ if(+k>=0&&+k<50&&c.done[k])n++; }); return n; }
function code50GroupOf(idx){ for(const g of CODE50_GROUPS){ if(idx>=g.start&&idx<g.end) return g; } return CODE50_GROUPS[0]; }

function code50Toggle(idx){
  const c=ensureCode50();
  if(c.done[idx]){ delete c.done[idx]; } else { c.done[idx]=Date.now(); }
  saveState(); cloudSave(); renderCode50(); renderSidebar();
}

function code50ShowAnswer(idx){
  const c=ensureCode50(); c.shown[idx]=1;
  saveState(); cloudSave(); renderCode50();
}

function code50DoToday(){
  const idx=code50TodayIdx();
  if(idx<0||idx>=50){ toast(idx>=50?'50题已全部排完':'今天还没到开始日'); return; }
  const c=ensureCode50(); c.done[idx]=Date.now();
  saveState(); cloudSave(); renderCode50(); renderSidebar();
  toast('已打卡：'+CODE50_DATA[idx].title);
}

function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function code50ProblemCard(idx){
  const p=CODE50_DATA[idx]; if(!p) return '';
  const c=ensureCode50();
  const done=!!c.done[idx];
  const shown=!!c.shown[idx];
  const g=code50GroupOf(idx);
  let h='<div class="p-card" style="margin-bottom:14px;border-left:3px solid '+g.color+'">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">'
    +'<h3 style="margin:0">第'+p.n+'题 '+p.stars+' '+escHtml(p.title)+'</h3>'
    +(done?'<span style="color:#0a8a5f;font-weight:600">已完成</span>':'<span style="color:#999">未完成</span>')
    +'</div>'
    +'<div style="margin-top:10px;line-height:1.8"><b>题目：</b>'+escHtml(p.problem)+'</div>';
  if(shown){
    h+='<div style="margin-top:12px"><b>参考代码：</b><pre style="background:#1e1e2e;color:#e4e4e4;padding:14px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.6"><code>'+escHtml(p.code)+'</code></pre></div>';
    if(p.complexity) h+='<div style="margin-top:8px;color:#666;font-size:13px"><b>复杂度：</b>'+escHtml(p.complexity)+'</div>';
  } else {
    h+='<div style="margin-top:12px;padding:14px;background:#f5f5f5;border-radius:8px;color:#888;font-size:13.5px">做完题目后点击下方按钮查看参考答案与代码</div>';
  }
  h+='<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">';
  if(!shown) h+='<button class="p-btn" onclick="code50ShowAnswer('+idx+')">做完了，显示答案</button>';
  if(!done) h+='<button class="p-btn" style="background:#0a8a5f;color:#fff" onclick="code50Toggle('+idx+')">标记完成</button>';
  else h+='<button class="p-btn" onclick="code50Toggle('+idx+')">取消完成</button>';
  h+='</div></div>';
  return h;
}

function code50Grid(){
  const c=ensureCode50(), todayIdx=code50TodayIdx();
  let cells='';
  for(let i=0;i<50;i++){
    const g=code50GroupOf(i);
    const done=!!c.done[i], isToday=(i===todayIdx);
    const bg=done?g.color:(isToday?g.bg:'#f5f5f5');
    const col=done?'#fff':g.color;
    const bd=isToday?'box-shadow:0 0 0 2px var(--ink);':'';
    cells+='<button class="r-cell" title="第'+(i+1)+'题 '+CODE50_DATA[i].title+(done?' · 已完成':'')+(isToday?' · 今日':'')+'" '
      +'style="background:'+bg+';color:'+col+';'+bd+'" onclick="code50Go('+i+')">'+(i+1)+'</button>';
  }
  return '<div class="r-grid">'+cells+'</div>';
}

function code50Go(idx){
  ensureCode50();
  // 滚动到对应题目卡片
  const cards=document.querySelectorAll('[data-c50idx]');
  for(const el of cards){ if(+el.dataset.c50idx===idx){ el.scrollIntoView({behavior:'smooth',block:'start'}); el.style.outline='2px solid #c05b1f'; setTimeout(()=>el.style.outline='',1500); return; } }
  // 如果不在列表里（比如点了网格但题目没展开），直接展开全部
  renderCode50();
  setTimeout(()=>code50Go(idx),50);
}

function renderCode50(){
  const app=$('#code50App'); if(!app)return;
  ensureCode50();
  const doneN=code50DoneN();
  const todayIdx=code50TodayIdx();
  const pct=Math.round(100*doneN/50);
  const start=code50Start();
  const todayTitle=(todayIdx>=0&&todayIdx<50)?CODE50_DATA[todayIdx].title:null;

  let h='';
  h+='<div class="p-hero"><div class="p-stat"><div class="n">'+doneN+'<small>/ 50</small></div><div class="l">已完成</div></div>'
    +'<div class="p-stat"><div class="n">'+(todayIdx+1<50?todayIdx+1:50)+'<small>/ 50</small></div><div class="l">今日题号</div></div>'
    +'<div class="p-stat"><div class="n">'+(50-doneN)+'<small>题</small></div><div class="l">剩余</div></div>'
    +'<div class="p-stat"><div class="n">'+pct+'<small>%</small></div><div class="l">进度</div></div></div>';

  // 今日题卡片
  h+='<div style="margin-bottom:16px">';
  if(todayTitle){
    h+='<div class="sub" style="margin-bottom:8px">'+start+' 开始 · 第 <b>'+(todayIdx+1)+'</b> 天（今天）</div>';
    h+=code50ProblemCard(todayIdx);
  } else if(todayIdx>=50){
    h+='<div class="p-alert ok"><b>50题已全部排完。</b>可在下方逐题回顾或补做。</div>';
  } else {
    h+='<div class="sub">今天还没到开始日（'+start+'）。</div>';
  }
  h+='</div>';

  h+='<div class="p-prog" style="margin-bottom:16px"><span>'+doneN+' / 50</span><div class="pbar" style="flex:1"><i style="width:'+pct+'%;background:#c05b1f"></i></div><span>'+pct+'%</span></div>';

  // 全部题目列表
  h+='<div class="p-card"><h3>全部50题（先做题，做完点"显示答案"核对）</h3>';
  let legend='';
  for(const g of CODE50_GROUPS){
    legend+='<span style="display:inline-block;width:10px;height:10px;background:'+g.color+';border-radius:2px;margin-right:5px"></span>'+g.name+' '+(g.start+1)+'-'+g.end+'　';
  }
  h+='<div class="sub" style="margin:6px 0 14px">'+legend+'</div>';
  for(let i=0;i<50;i++){
    h+='<div data-c50idx="'+i+'">'+code50ProblemCard(i)+'</div>';
  }
  h+='</div>';

  app.innerHTML=h;
}

function code50SideMeta(){ try{ return code50DoneN()+' / 50 题'; }catch(e){ return '50 题'; } }

// 今日计划页用：返回今日代码题摘要
function code50TodayCard(){
  const idx=code50TodayIdx();
  if(idx<0||idx>=50) return '';
  const p=CODE50_DATA[idx]; if(!p) return '';
  const c=ensureCode50();
  const done=!!c.done[idx];
  return '<div style="margin:12px 0;padding:12px 14px;background:#fff7f0;border:1px solid #f0c8a0;border-radius:8px">'
    +'<div style="font-weight:600;color:#c05b1f;margin-bottom:6px">代码题打卡 · 第'+p.n+'题（408综合应用题）</div>'
    +'<div style="font-size:13.5px;line-height:1.7;color:#333">'+p.title+'</div>'
    +'<div style="margin-top:8px;display:flex;gap:8px;align-items:center">'
    +(done
      ?'<span style="color:#0a8a5f;font-weight:600">✓ 今日已完成</span>'
      :'<button class="p-btn" style="background:#c05b1f;color:#fff;padding:4px 12px;font-size:13px" onclick="location.hash=\'#/code50\'">去做题</button>')
    +'</div></div>';
}

Object.assign(globalThis, { CODE50_DATA, ensureCode50, mergeCode50, code50Start, code50TodayIdx, code50DoneN, code50Toggle, code50ShowAnswer, code50DoToday, code50Go, code50GroupOf, code50ProblemCard, code50Grid, renderCode50, code50SideMeta, code50TodayCard });
export { CODE50_DATA, ensureCode50, mergeCode50, code50Start, code50TodayIdx, code50DoneN, code50Toggle, code50ShowAnswer, code50DoToday, code50Go, code50GroupOf, code50ProblemCard, code50Grid, renderCode50, code50SideMeta, code50TodayCard };
