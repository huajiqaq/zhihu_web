class SwipeRefresh extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
        <style>
          .container {
            overflow: auto;
            position: relative;
          }

          .refresh-indicator {
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 30px;
            display: none;
            pointer-events: none; /* 避免遮挡内容 */
            z-index: 1;
            background-color: #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: transform 0.3s ease; /* 平滑过渡 */
          }

          .spinner {
            border: 3px solid rgba(0, 0, 0, 0.1);
            box-sizing: border-box;
            border-top-color: rgb(var(--mdui-color-primary));
            border-radius: 50%;
            width: 100%;
            height: 100%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <div class="container">
          <div class="refresh-indicator" id="refreshIndicator">
            <div class="spinner"></div>
          </div>
          <div class="content" id="content">
            <slot></slot>
          </div>
        </div>
      `;

        this.container = this.shadowRoot.querySelector('.container');
        this.refreshIndicator = this.shadowRoot.querySelector('#refreshIndicator');
        this.isRefreshing = false;
        this.startY = 0;
        this.currentY = 0;
        this.threshold = 50; // 触发刷新的距离阈值
        this.maxDragDistance = 100; // 最大拖动距离
        this.refreshFunction = null;
        this.isDragging = false; // 新增标志位
        this.diff = 0;
        this.timeoutId = null; // 用于定时器

        this.handleStart = this.handleStart.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleEnd = this.handleEnd.bind(this);

        this.container.addEventListener('touchstart', this.handleStart);
        this.container.addEventListener('touchmove', this.handleMove);
        this.container.addEventListener('touchend', this.handleEnd);

        this.container.addEventListener('mousedown', this.handleStart);
        this.container.addEventListener('mousemove', this.handleMove);
        this.container.addEventListener('mouseup', this.handleEnd);
    }

    setRefreshFunction(func) {
        this.refreshFunction = func;
    }

    setHeight(height) {
        this.container.style.height = height;
    }

    handleStart(event) {
        this.isDragging = true;
        this.startY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        this.clearTimeout(); // 清除之前的定时器
    }

    handleMove(event) {
        if (!this.isDragging || this.isRefreshing) return;
        this.shadowRoot.querySelector('.content').style.pointerEvents = "none";
        this.currentY = 'touches' in event ? event.touches[0].clientY : event.clientY;
        const diff = Math.min(this.currentY - this.startY, this.maxDragDistance);

        if (diff > 10 && this.container.scrollTop === 0) {
            this.refreshIndicator.style.display = 'block';
            this.refreshIndicator.style.transform = `translateX(-50%) translateY(${diff}px)`;
        } else {
            this.refreshIndicator.style.display = 'none';
            this.refreshIndicator.style.transform = 'translateX(-50%) translateY(0)';
        }

        this.diff = diff;
        this.clearTimeout(); // 清除之前的定时器
        this.setTimeout(event); // 设置新的定时器
    }

    handleEnd(event) {
        if (!this.isDragging || this.isRefreshing) return;
        if (this.diff > this.threshold && this.container.scrollTop === 0) {
            this.showRefreshIndicator();
        } else {
            this.hideRefreshIndicator()
        }
        this.shadowRoot.querySelector('.content').style.pointerEvents = "unset";
        this.diff = 0;
        this.isDragging = false; // 重置标志位
        this.clearTimeout(); // 清除定时器
    }

    showRefreshIndicator(needrefresh = true) {
        if (this.isRefreshing) return;
        this.refreshIndicator.style.display = 'block';
        this.refreshIndicator.style.transform = `translateX(-50%) translateY(${this.threshold}px)`; // 固定位置
        this.isRefreshing = true;
        if (needrefresh) {
            this.refreshData();
        }
    }

    refreshData() {
        if (this.refreshFunction) {
            this.refreshFunction(() => {
                this.hideRefreshIndicator();
            });
        }
    }

    hideRefreshIndicator() {
        this.refreshIndicator.style.display = 'none';
        this.refreshIndicator.style.transform = 'translateX(-50%) translateY(0)';
        this.isRefreshing = false;
    }

    triggerRefresh(isRefreshing) {
        if (isRefreshing) {
            this.showRefreshIndicator(false);
        } else {
            this.hideRefreshIndicator();
        }
    }

    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    setTimeout(event) {
        this.timeoutId = setTimeout(() => {
            this.handleEnd(event);
        }, 2000); // 2秒后自动触发结束
    }
}

customElements.define('swipe-refresh', SwipeRefresh);
