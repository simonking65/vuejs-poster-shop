

var PRICE = 9.99;
var LOAD_NUM = 10;

var pusher = new Pusher('dbd5eda19daef4c6ef20', {
    cluster: 'eu',
    encrypted: true
});

new Vue({
  el: '#app',
  data: {
      total: 0,
      items: [],
      cart: [],
      results: [],
      newSearch: 'anime',
      lastSearch: '',
      loading: false, 
      price: PRICE, 
      pusherUpdate: false
  },
  methods: {
      appendItems: function() {
          if (this.items.length < this.results.length) {
            var append = this.results.slice(this.items.length, this.items.length + LOAD_NUM);
            this.items = this.items.concat(append);
          }
          
      },
      onSubmit: function() {
          if (this.newSearch.length) {
        this.items = [];
        this.loading = true;
        this.$http
          .get('/search/'.concat(this.newSearch))
          .then(function(res) {
              this.lastSearch = this.newSearch;
              this.results = res.data;
              this.appendItems();
              this.loading = false;
          })
        }
      },
      addItem: function(index){
          var item = this.items[index];
          var found = false;
          for (var i= 0; i<this.cart.length; i++) {
              if (this.cart[i].id === item.id) {
                this.cart[i].qty++;
                found = true;
                break;
              }
          }
          if (!found) {
          this.cart.push({
              id: item.id,
              price: PRICE,
              title: item.title,
              qty: 1
          });
        }
          this.total += PRICE;
      },
    inc: function(item) {
        item.qty ++;
        this.total += PRICE;
    },
    dec: function(item) {
        item.qty--;
        this.total -= PRICE;
        if (item.qty <= 0) {
            for (var i = 0; i < this.cart.length; i++) {
                if (this.cart[i].id === item.id) {
                    this.cart.splice(i, 1);
                    break;
                }
            }
        }
    }
  },
filters: {
    currency: function(price) {
        return "$".concat(price.toFixed(2)); 
    }
},
watch: {
    cart: { 
        handler: function(val) {
            if (!this.pusherUpdate) {
                this.$http.post('/cart_update', val);
            } else {
                this.pusherUpdate = false;
            }
        
    },
    deep: true
}
},
mounted: function() {
    this.onSubmit();
    var vueInstance = this;

    var elem = document.getElementById('product-list-bottom');
    var watcher = scrollMonitor.create(elem);
    watcher.enterViewport(function() {
       vueInstance.appendItems();
    });    
    var channel = pusher.subscribe('cart');
    channel.bind('update', function(data) {
        vueInstance.pusherUpdate = true; 
        vueInstance.cart = data;
        vueInstance.total = 0;
        for (var i = 0; i < vueInstance.cart.length; i++) {
            vueInstance.total += PRICE * vueInstance.cart[i].qty;
        }
    })
}
});
