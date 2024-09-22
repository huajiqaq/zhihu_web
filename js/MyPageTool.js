class MyPageTool {
    constructor(conf) {
        if (!conf || !conf.view) {
            throw new Error("至少要绑定一个view");
        }
        this.canclick = {};  // 用于限制点击的标识
        this.pagedata = [];  // 存储每个页面的数据
        this.urls = [];      // 存储每个页面的 URL
        this.allcount = 0;   // 总数据条数
        this.addpos = 0;     // 添加位置偏移
        this.funcs = [];     // 每页加载的func

        for (let key in conf) {
            if (conf.hasOwnProperty(key)) { // 确保 key 是 conf 的直接属性
                this[key] = conf[key];
            }
        }
    }

    initPage() {
        this.pagedata.push({
            prev: false,
            nexturl: false,
            isend: false,
            canload: true,
            isfirst: true,
            needcheck: true
        });

        if (this.addcanclick) {
            this.canclick[this.allcount] = true;
        }

        const pos = this.allcount;

        if (this.func) {
            this.funcs[pos] = this.func;
        }

        const [thispage, thissr] = this.getItem(pos)


        new InfiniteLoader(thispage, () => {
            return this.referfunc(pos, false)
        }).startObserving()

        // 设置刷新函数
        thissr.setRefreshFunction((callback) => {
            console.log('刷新触发！');
            this.clearItem(pos)
            this.refer(pos, true)
            setTimeout(() => {
                callback(); // 调用回调函数重置刷新状态
            }, 1000);
        });

        // 变量添加
        this.allcount = this.allcount + 1

        return this

    }

    addPage(addtype, mydata, deftab) {
        if (this.tabview == null) {
            throw new Error("单页不支持addPage");
        }

        const dataType = typeof mydata;

        if (dataType === "number") {
            for (let i = 1; i <= mydata; i++) {
                this.addPage(addtype);
            }
            return this;
        } else if (dataType === "object" && Array.isArray(mydata)) {
            for (let i = 1; i <= mydata.length - this.addpos; i++) {
                this.addPage(addtype);
            }

            const tabs = this.tabview.querySelectorAll("mdui-tab")

            for (let i = 0; i < mydata.length; i++) {
                const text = mydata[i];
                tabs.textContent = text;
                if (deftab && deftab === text) {
                    tab.select();
                }
            }

            return this;
        }

        // 已经添加页的总数
        this.allcount += 1;
        // 要添加页的类型
        const addtypeValue = addtype || 1;

        let addview;

        if (addtypeValue === 1) {
            addview = document.createElement('div');
            addview.className = 'swipe-refresh';
            const cardItem = document.createElement('div');
            cardItem.className = 'content';
            cardItem.style.margin = '16px';
            addview.appendChild(cardItem);
        } else if (addtypeValue === 2) {
            addview = document.createElement('div');
            addview.className = 'content';
            addview.style.margin = '16px';
        }

        const tabValue = "tab-" + this.tabview.querySelectorAll("mdui-tab").length + 1
        // 创建 mdui-tab 元素
        const tab = document.createElement('mdui-tab');
        tab.value = tabValue;
        tab.textContent = tabText;

        // 创建 mdui-tab-panel 元素
        const panel = document.createElement('mdui-tab-panel');
        panel.slot = 'panel';
        panel.value = tabValue;
        panel.innerHTML = panelContent;

        this.tabview.appendChild(tab)
        this.tabview.appendChild(panel)

        // 初始化页数据
        this.initPage();

        return this;
    }


    loadShieldWords(tab) {
        const shieldWords = localStorage.getItem("屏蔽词");
        if (shieldWords && shieldWords.replace(/\s+/g, "") !== "") {
            const handler = {
                set: (target, key, value) => {
                    const matchContent = `${value.标题}${value.预览内容}`;
                    if (this.containsAny(matchContent, shieldWords)) {
                        return false; // 不设置属性
                    }
                    target[key] = value;
                    return true;
                }
            };
            return new Proxy(tab, handler);
        }
        return tab;
    }

    containsAny(testString, shieldWords) {
        const words = shieldWords.split(/\s+/);
        return words.some(word => testString.includes(word));
    }

    setUrls(urls) {
        this.urls = urls
        return this
    }

    setUrlItem(url, index) {
        const pos = index || this.getCurrentItem()
        this.urls[pos] = url
        return this
    }

    getItem(pos) {
        const index = pos || this.getCurrentItem();
        if (this.tabview == null) {
            return [this.view, this.sr];
        }

        const panel = this.tabview.querySelectorAll("mdui-tab-panel")[index];
        const thislist = panel.querySelector(".content");
        const thissr = panel.querySelector("swipe-refresh");
        return [thislist, thissr];
    }

    setObserverDivDisplay(thispage, isVisible) {
        const ObserverDiv = thispage.parentElement.querySelector("#observerDiv");
        if (ObserverDiv) {
            ObserverDiv.style.display = isVisible ? "" : "none";
        }
    }

    refer(pos, isprev, isinit) {
        const index = pos || this.getCurrentItem(pos);
        const [thispage, thissr] = this.getItem(index);

        if ((isinit && thispage.children.length > 1)) {
            return this;
        }

        this.referfunc(index, isprev);
        return this;
    }

    clearItem(pos) {
        const index = this.getCurrentItem(pos);
        this.pagedata[index] = {
            prev: false,
            nexturl: false,
            isend: false,
            canload: true,
            isfirst: true,
            needcheck: true
        };

        const [thispage, thissr] = this.getItem(index);

        // 清空 隐藏ObserverDiv
        this.setObserverDivDisplay(thispage, false)

        thispage.innerHTML = ''; // 清空视图内容
    }

    getCurrentItem() {
        const index = this.tabview ? this.tabview.activeTab.value.split("tab-")[1] + 1 - this.addpos : 0;
        return index;
    }

    setOnTabListener(callback) {
        const view = this.tabview;
        const canclick = this.canclick;
        const referfunc = this.referfunc;

        if (!referfunc) {
            throw new Error("你必须首先调用createfunc来创建一个刷新的函数");
        }

        const tabCallback = callback || (() => { });

        const onTabSelected = (value) => {
            const pos = value - this.addpos;
            tabCallback(this, pos);

            const [thispage, thissr] = this.getItem(lastSelectedValue);
            // 切换 隐藏上一个ObserverDiv
            this.setObserverDivDisplay(thispage, false)

            if (pos > 0 && canclick[pos]) {
                canclick[pos] = false;
                setTimeout(() => {
                    canclick[pos] = true;
                }, 1050);
            }

            this.refer(pos, false, true);
        };


        const onTabReselected = (value) => {
            const pos = value - this.addpos;
            tabCallback(this, pos);

            if (pos > 0 && canclick[pos]) {
                canclick[pos] = false;
                setTimeout(() => {
                    canclick[pos] = true;
                }, 1050);
            }

            this.clearItem(pos);
            this.refer(pos, true);
        };

        let lastSelectedValue = this.getCurrentItem();

        view.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName.toLowerCase() === 'mdui-tab') {
                const currentValue = target.value;
                const index = currentValue.split("tab-")[1];

                if (currentValue !== lastSelectedValue) {
                    if (typeof onTabSelected === 'function') {
                        onTabSelected(currentValue, index);
                    }
                } else {
                    if (typeof onTabReselected === 'function') {
                        onTabReselected(currentValue, index);
                    }
                }

                lastSelectedValue = currentValue;
            }
        });

        return this;
    }

    createfunc() {
        if (this.referfunc) {
            throw new Error("referfunc已创建 只能存在一个referfunc");
        }

        if (!this.funcs) {
            throw new Error("创建referfunc时必须拥有自身funcs属性");
        }

        const needlogin = this.needlogin;
        this.referfunc = (pos, isprev) => {
            const pagedata = this.pagedata;

            if (pos == null) {
                pos = 0;
            }

            if (isprev) {
                pagedata[pos].isprev = true;
            }

            isprev = pagedata[pos].isprev;
            const [thispage, thissr] = this.getItem(pos);

            if (pagedata[pos].isend) {
                return alert("已经到底了");
            }

            let posturl = isprev ? pagedata[pos].prev : pagedata[pos].nexturl;
            posturl = posturl || this.urls[pos];

            if (needlogin && !this.getLogin()) {
                return alert("请登录后使用本功能");
            }

            const head = this.head ? window[this.head] : undefined;

            if (this.urlfunc) {
                [posturl, head] = this.urlfunc(posturl, head);
            }

            // 发起请求
            return new Promise((resolve, reject) => {

                zHttp.get(posturl, head, (code, content) => {
                    if (code === 200) {
                        pagedata[pos].isprev = false;
                        const data = JSON.parse(content);

                        if (data.paging) {
                            pagedata[pos].isend = data.paging.is_end;
                            pagedata[pos].prev = data.paging.previous;
                            pagedata[pos].nexturl = data.paging.next;

                            if (pagedata[pos].isend === false) {
                                pagedata[pos].canload = true;
                            } else if (pagedata[pos].isend) {
                                alert("没有新内容了");
                            }
                        }

                        if (pagedata[pos].isfirst) {
                            pagedata[pos].isfirst = false;
                            if (this.firstfunc) {
                                this.firstfunc(data, thispage, pos);
                            }
                        }

                        const func = this.funcs[pos];

                        if (data.data) {
                            data.data.forEach(v => func(v, thispage));
                        } else {
                            func(data, thispage);
                        }

                        resolve();

                        // 请求成功 显示ObserverDiv
                        this.setObserverDivDisplay(thispage, true)
                    }
                });

                thissr.triggerRefresh(true);
                pagedata[pos].canload = false;

                setTimeout(() => {
                    thissr.triggerRefresh(false);
                }, 1000);

            });
        };

        return this;
    }

}