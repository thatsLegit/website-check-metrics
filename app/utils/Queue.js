// custom implementation of a queue, still better than using an array

class Node {
    constructor(value, next = null) {
        this.value = value;
        this.next = next;
    }
}

class Queue {
    constructor() {
        this.first = null;
        this.last = null;
        this.size = 0;
    }
    enqueue(val) {
        const newNode = new Node(val);
        if (!this.size) {
            this.last = newNode;
            this.first = newNode;
        } else {
            this.last.next = newNode;
            this.last = newNode;
        }
        this.size++;
    }
    dequeue() {
        if (!this.size) return undefined;
        let shifted = this.first;
        this.first = this.first.next;
        this.size--;
        if (this.size === 0) {
            this.last = null;
        }
        return shifted.value;
    }
    findMax() {
        if (!this.size) return undefined;
        if (this.size == 1) return this.first.value;
        let current = this.first;
        let max = -Infinity;
        while (current.next) {
            current.value > max && (max = current.value);
            current = current.next;
        }
        return max;
    }
}

module.exports = Queue;