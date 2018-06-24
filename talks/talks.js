var app = new Vue({
  el: '#app',
  data: {
    search: '',
    results: [],
    talks: {},
    words: {},
    tags: {}
  },

  methods: {
    filter: function() {
      var result = this.filterTalks(this.search);
      console.log(result.length);
      if (result.length <= 20)
        this.results = result;
      else
        this.results = [];
    },

    http: function(url, callback) {
      if (window.XMLHttpRequest === undefined)
        return;
      var req = new XMLHttpRequest(), ctx = this;
      req.open("GET", url);
      req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status == 200) {
          var data = (JSON.parse(req.responseText));
          callback.call(ctx, data);
        }
      };
      req.send();
    },

    processTalks: function(data) {
      var talks = {};

      for (var i = 0; i < data.length; i++) {
        if (!data[i].talks)
          continue;

        // First creating an lightweight Cx object that talks would reference
        var cx = {}
        for (var p in data[i]) {
          if (p != 'talks')
            cx[p] = data[i][p];
        }

        // Now let's put all talks into the array
        for (var j = 0; j < data[i].talks.length; j++) {
          var talk = data[i].talks[j];
          talk.cx = cx;
          if (talk.youtube)
            talk.youtube = 'https://www.youtube.com/watch?v=' + talk.youtube;
          talks[i+'-'+j] = talk;
        }
      }
      return talks;
    },

    extractKeywords: function() {
    },

    filterTalks: function(str) {
      str = str.toLowerCase();
      var res = [];
      for (var k in this.talks) {
        if (this.talks[k].title.toLowerCase().indexOf(str) >= 0)
          res.push(this.talks[k]);
      }
      return res;
    }
  },

  created: function() {
    // After the component has been loaded, request the talks list.
    this.http('talks.json', function(data) {
      this.talks = this.processTalks(data);
      this.extractKeywords();
    });
  }
});
