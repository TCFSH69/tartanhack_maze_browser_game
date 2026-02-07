// 檔名：ghost.js
class Ghost {
    constructor(startX, startY) {
        this.tileSize = 20;
        // 為了讓移動更精準，我們把座標固定在「像素」上
        this.x = startX * this.tileSize; 
        this.y = startY * this.tileSize;
        
        this.size = 18; // 略小於格子，避免卡牆
        this.color = 'red'; // 改成紅色，因為它變強了
        this.speed = 0.2; // 建議設為能被 tileSize (20) 整除的數 (1, 2, 4, 5)，這樣移動計算最準
        
        // 導航系統
        this.path = []; // 記憶目前要走的路徑
        this.targetX = this.x; // 下一步的目標像素座標
        this.targetY = this.y;
    }

    update(player, map, mapWidth, mapHeight) {
        // 1. 檢查是否「到達了某個格子的正中心」
        // 我們允許一點點誤差 (小於移動速度)
        let distToTarget = Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY);
        
        if (distToTarget < this.speed) {
            // --- 到達目標點了！修正座標 (Snap) 確保完全對齊 ---
            this.x = this.targetX;
            this.y = this.targetY;

            // --- 2. 開始規劃下一步：呼叫 BFS ---
            // 算出鬼目前的格子座標
            let gx = Math.round(this.x / this.tileSize);
            let gy = Math.round(this.y / this.tileSize);

            // 算出下一步該去哪
            let nextMove = this.bfs(gx, gy, player.x, player.y, map, mapWidth, mapHeight);
            
            if (nextMove) {
                // 如果有路，設定新的像素目標
                this.targetX = nextMove.x * this.tileSize;
                this.targetY = nextMove.y * this.tileSize;
            }
        }

        // --- 3. 執行移動 (往 targetX, targetY 靠近) ---
        if (this.x < this.targetX) this.x += this.speed;
        if (this.x > this.targetX) this.x -= this.speed;
        if (this.y < this.targetY) this.y += this.speed;
        if (this.y > this.targetY) this.y -= this.speed;
    }

    // --- BFS 演算法核心 ---
    // 輸入：起點(gx,gy)、終點(px,py)、地圖
    // 輸出：下一步該走的格子座標 {x, y}
    bfs(startx, starty, endx, endy, map, mw, mh) {
        // 簡單優化：如果你已經在玩家位置，就不動
        if (startx === endx && starty === endy) return null;

        let queue = [{x: startx, y: starty}]; // 待檢查的格子佇列
        let cameFrom = {}; // 記錄路徑來源，key="x,y", value={x,y} (上一格是誰)
        let startKey = `${startx},${starty}`;
        cameFrom[startKey] = null; // 起點沒有來源

        let found = false;

        // 開始擴散搜尋
        while (queue.length > 0) {
            let current = queue.shift(); // 取出第一個

            // 如果找到玩家了！
            if (current.x === endx && current.y === endy) {
                found = true;
                break;
            }

            // 檢查上下左右四個鄰居
            const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
            for (let dir of dirs) {
                let nextX = current.x + dir.x;
                let nextY = current.y + dir.y;
                let key = `${nextX},${nextY}`;

                // 判斷是否可走：
                // 1. 不出界 2. 不是牆壁 3. 沒走過
                if (nextX >= 0 && nextX < mw && nextY >= 0 && nextY < mh && 
                    map[nextY][nextX] === 1 && 
                    !cameFrom.hasOwnProperty(key)) {
                    
                    queue.push({x: nextX, y: nextY});
                    cameFrom[key] = {x: current.x, y: current.y}; // 記錄我是從 current 走過來的
                }
            }
        }

        // 如果沒路 (found = false)，比如被牆壁封死，就回傳 null
        if (!found) return null;

        // --- 回溯路徑 (Path Reconstruction) ---
        // 我們從終點 (玩家位置) 一路倒推回起點，找出鬼的「第一步」
        let currKey = `${endx},${endy}`;
        let path = [];
        
        while (currKey !== startKey) {
            let pos = currKey.split(',').map(Number);
            path.push({x: pos[0], y: pos[1]}); // 把這個點加入路徑
            
            let parent = cameFrom[currKey];
            currKey = `${parent.x},${parent.y}`;
        }

        // path 現在是 [玩家, 玩家前一格, ..., 鬼的下一步]
        // 我們要的是 path 的最後一個元素 (因為是倒推的)
        return path[path.length - 1];
    }

    checkCollision(player) {
        // 簡單的矩形碰撞
        let px = player.x * this.tileSize;
        let py = player.y * this.tileSize;
        return (
            this.x < px + this.tileSize &&
            this.x + this.size > px &&
            this.y < py + this.tileSize &&
            this.y + this.size > py
        );
    }

    draw(ctx, offsetX, offsetY) {
        let screenX = this.x + offsetX;
        let screenY = this.y + offsetY;
        
        // 只有在畫面內才畫
        if (screenX > -this.size && screenX < ctx.canvas.width &&
            screenY > -this.size && screenY < ctx.canvas.height) {
            
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX, screenY, this.size, this.size);
            
            // 畫眼睛 (讓他看著目標方向)
            let eyeOffsetX = 0, eyeOffsetY = 0;
            if (this.targetX > this.x) eyeOffsetX = 2;
            if (this.targetX < this.x) eyeOffsetX = -2;
            if (this.targetY > this.y) eyeOffsetY = 2;
            if (this.targetY < this.y) eyeOffsetY = -2;

            ctx.fillStyle = 'white';
            ctx.fillRect(screenX + 4 + eyeOffsetX, screenY + 4 + eyeOffsetY, 5, 5);
            ctx.fillRect(screenX + 10 + eyeOffsetX, screenY + 4 + eyeOffsetY, 5, 5);
        }
    }
}