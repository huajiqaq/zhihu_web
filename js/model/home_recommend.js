class Base {
    constructor() {
    }

    resolvedata(v, doc) {
        if (v.type !== "feed") {
            return;
        }

        const isread = '"t"';
        const readdata = v.brief;

        const vTarget = v.target || v;
        let title = vTarget.title;
        const voteCount = vTarget.voteup_count || vTarget.vote_count;
        const commentCount = vTarget.comment_count;
        const author = vTarget.author.name;
        const excerpt = vTarget.excerpt || vTarget.excerpt_title;
        const previewContent = `${author} : ${excerpt}`;

        const id = vTarget.id;
        let splitString;
        const dataType = vTarget.type;

        switch (dataType) {
            case "answer":
                title = vTarget.question.title;
                splitString = "回答分割";
                break;
            case "pin":
                title = `${author}发表了想法`;
                splitString = "想法分割";
                break;
            case "article":
                splitString = "文章分割";
                break;
            case "zvideo":
                splitString = "视频分割";
                break;
            case "drama":
                splitString = "直播分割";
                break;
            default:
                return;
        }

        const idContent = `${splitString}${id}`;

        const add = {
            标题: title,
            预览内容: previewContent,
            评论数: String(commentCount),
            点赞数: String(voteCount),
            id内容: idContent,
            isread: isread,
            readdata: readdata,
            datatype: dataType
        };

        const card = this.createCard(add)
        doc.appendChild(card)
    }

    createBottom(voteup, comment) {
        // 创建外层 div 容器
        const containerDiv = document.createElement('div');
        containerDiv.style.display = 'inline-flex';
        containerDiv.style.alignItems = 'center';

        if (voteup) {
            // 创建 mdui-icon
            const iconDiv = document.createElement('mdui-icon');
            iconDiv.setAttribute('name', 'thumb_up--two-tone');
            containerDiv.appendChild(iconDiv);
            // 创建 span
            const span = document.createElement('span');
            span.textContent = voteup;
            containerDiv.appendChild(span);
        }

        if (comment) {
            // 创建 mdui-icon
            const iconDiv = document.createElement('mdui-icon');
            iconDiv.setAttribute('name', 'message--two-tone');
            iconDiv.style.marginLeft = "20px"
            containerDiv.appendChild(iconDiv);
            // 创建 span
            const span = document.createElement('span');
            span.textContent = comment;
            containerDiv.appendChild(span);
        }

        return containerDiv;
    }

    createCard(data) {
        // 创建卡片容器
        const card = document.createElement('mdui-card');
        card.clickable = true;
        card.variant = 'elevated';
        card.style.width = "100%"
        card.style.userSelect = "none"
        card.style.padding = "16px"

        // 创建标题
        const headlineElement = document.createElement('div');
        headlineElement.style.fontSize = "18sp"
        headlineElement.style.fontWeight = "bold"
        headlineElement.classList.add('headline');
        headlineElement.textContent = data.标题;

        // 创建描述
        const descriptionElement = document.createElement('div');
        descriptionElement.classList.add('description');
        descriptionElement.textContent = data.预览内容;

        // 将标题和描述添加到卡片中
        card.appendChild(headlineElement);
        card.appendChild(descriptionElement);
        card.appendChild(createBottom(data.点赞数, data.评论数))

        const idContent = data.id内容;

        // 后续适配
        card.onClick = (view) => {
            if (getLogin()) {
                homePagetool.getItemData()[position].isread = '"r"';

                const postdata = JSON.stringify(readdata);
                const encodedPostdata = encodeURIComponent(`[["r",${postdata}]]`);
                const finalPostdata = `targets=${encodedPostdata}`;

                zHttp.post("https://api.zhihu.com/lastread/touch/v2", finalPostdata, apphead, (code, content) => {
                    if (code === 200) {
                        // 处理成功响应
                    }
                });
            }
            this.handleClick(idContent, title);
        }

        // 长按后期支持
        card.onLongClick = (view) => {
            let mytype, myid;
            if (idContent.includes("文章分割")) {
                mytype = "article";
                myid = idContent.match(/文章分割(.+)/)[1];
            } else if (idContent.includes("想法分割")) {
                mytype = "pin";
                myid = idContent.match(/想法分割(.+)/)[1];
            } else if (idContent.includes("视频分割")) {
                mytype = "zvideo";
                myid = idContent.match(/视频分割(.+)/)[1];
            } else if (idContent.includes("直播分割")) {
                mytype = "drama";
                myid = idContent.match(/直播分割(.+)/)[1];
            } else {
                mytype = "answer";
                myid = idContent.match(/分割(.+)/)[1];
            }

            zHttp.get(`https://api.zhihu.com/negative-feedback/panel?scene_code=RECOMMEND&content_type=${mytype}&content_token=${myid}`, apphead, (code, content) => {
                if (code === 200) {
                    const menu = [];
                    const data = JSON.parse(content).data.items;
                    data.forEach((item) => {
                        const rawButton = item.raw_button;
                        const method = rawButton.action.method.toLowerCase();
                        const panelText = rawButton.text.panel_text;

                        menu.push({
                            panelText,
                            action: () => {
                                if (rawButton.action.backend_url) {
                                    zHttp.request(rawButton.action.backend_url, method, "", apphead, (code, content) => {
                                        if (code === 200) {
                                            alert(rawButton.text.toast_text);
                                        }
                                    });
                                } else if (rawButton.action.intent_url) {
                                    activity.newActivity("browser", [rawButton.action.intent_url + "&source=android&ab_signature=", "举报"]);
                                }
                            }
                        });
                    });

                    const pop = showPopMenu(menu);
                    pop.showAtLocation(view, 0, this.downx, this.downy);
                }
            });
        };

        card.href = "./content.html?type=" + data.datatype + "&id=" + data.id内容.split("分割")[1];

        return card;
    }

    initpage(view, sr) {
        return new MyPageTool({
            view: view,
            sr: sr,
            head: "head",
            func: this.resolvedata.bind(this)
        }).initPage()
            .createfunc()
            .setUrlItem("https://api.zhihu.com/topstory/recommend");
    }

}

window.home_recommend = Base;
