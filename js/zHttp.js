window.canLoad = true

window.zHttp = {

    setCallback(response, callback, data) {


        const code = response.status
        const responseText = response.responseText
        const headers = response.responseHeaders
        const method = "get"

        let decodedContent;
        try {
            decodedContent = JSON.parse(responseText);
        } catch (e) {
            // 解析失败
        }

        if (code === 403) {
            if (decodedContent && decodedContent.error && decodedContent.error.message && decodedContent.error.redirect) {
                if (!window.canLoad) {
                    alert(decodedContent.error.message);
                    if (confirm("立即跳转")) {
                        window.location.href = decodedContent.error.redirect;
                        alert("已跳转 成功后请自行退出");
                    }
                }
            } else if (decodedContent && decodedContent.error && decodedContent.error.message) {
                alert(decodedContent.error.message);
            }
        } else if (code === 401) {
            if (getLogin()) {
                if (!window.canLoad) {
                    alert("登录状态已失效 已自动帮你清除失效的登录状态 你可以点击下方我知道了来跳转登录");
                    if (confirm("我知道了")) {
                        clearAllCookies();
                        localStorage.removeItem("signdata");
                        localStorage.removeItem("idx");
                        localStorage.removeItem("udid");
                        window.location.href = "https://www.zhihu.com/signin";
                    }
                }
            }
        } else if (code === 400) {
            if (decodedContent && decodedContent.error && decodedContent.error.message) {
                alert(decodedContent.error.message);
            }
        } else if (headers && headers.Location) {
            this.request(headers.Location, method, data, {}, callback);
            return;
        }
        callback(code, responseText);
    },

    request(url, method, data, headers, callback) {
        method = method.toLowerCase();
        if (method === "get") {
            this.get(url, headers, callback);
        } else if (method === "delete") {
            this.delete(url, headers, callback);
        } else if (method === "post") {
            this.post(url, data, headers, callback);
        } else if (method === "put") {
            this.put(url, data, headers, callback);
        }
    },

    get(url, headers, callback) {
        if (!window.canLoad) return false;
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: headers,
            onload: (response) => {
                this.setCallback(response, callback);
            }
        });
    },

    delete(url, headers, callback) {
        if (!window.canLoad) return false;
        GM_xmlhttpRequest({
            method: "DELETE",
            url: url,
            headers: headers,
            onload: (response) => {
                this.setCallback(response, callback);
            }
        });
    },

    post(url, data, headers, callback) {
        if (!window.canLoad) return false;
        GM_xmlhttpRequest({
            method: "POST",
            url: url,
            data: data,
            headers: headers,
            onload: (response) => {
                this.setCallback(response, callback, data);
            }
        });
    },

    put(url, data, headers, callback) {
        if (!window.canLoad) return false;
        GM_xmlhttpRequest({
            method: "PUT",
            url: url,
            data: data,
            headers: headers,
            onload: (response) => {
                this.setCallback(response, callback, data);
            }
        });
    }
}