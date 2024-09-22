// 无限滚动加载类
class InfiniteLoader {
    constructor(targetElement, loadCallback) {
        this.targetElement = targetElement;
        this.loadCallback = loadCallback;
        this.observerDiv = this.createObserverDiv();
        this.observer = this.createObserver();
    }

    createObserverDiv() {
        const observerDiv = document.createElement('div');
        observerDiv.id = 'observerDiv';
        observerDiv.style.display = "none";
        this.targetElement.insertAdjacentElement('afterend', observerDiv);
        return observerDiv;
    }

    createObserver() {
        return new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.observer.unobserve(this.observerDiv);

                    this.loadCallback().then(() => {
                        this.observer.observe(this.observerDiv);
                    }).catch(error => {
                        console.error('Error loading content:', error);
                        this.observer.observe(this.observerDiv);
                    });
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: 1.0
        });
    }

    startObserving() {
        this.observer.observe(this.observerDiv);
    }
}