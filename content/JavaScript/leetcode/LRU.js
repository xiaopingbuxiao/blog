







class LRUCache {
  constructor(capacity) {
    this.keys = []
    this.cache = Object.create(null)
    this.capacity = capacity
  }
  get(key) {
    if (this.cache[key]) {
      remove(this.keys, key)
      this.keys.push(key)
      return this.cache[key]
    }
    return -1
  }
  put(key, value) {
    if (this.cache[key]) {
      this.cache[key] = value
      remove(this.keys, key)
      this.keys.push(key)
    } else {
      this.keys.push(key)
      this.cache[key] = value
      if (this.keys.length > this.capacity) {
        removeCache(this.cache, this.keys, this.keys[0])
      }
    }
  }
}


function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
function removeCache(cache, keys, key) {
  cache[key] = null
  remove(keys, key)
}





const cache = new LRUCache( 2 /* 缓存容量 */ );

cache.put(1, 1);
cache.put(2, 2);
cache.get(1);       // 返回  1
cache.put(3, 3);    // 该操作会使得密钥 2 作废
cache.get(2);       // 返回 -1 (未找到)
cache.put(4, 4);    // 该操作会使得密钥 1 作废
cache.get(1);       // 返回 -1 (未找到)
cache.get(3);       // 返回  3
cache.get(4);       // 返回  4



























