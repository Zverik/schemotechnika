var app = new Vue({
  el: '#app',
  data: {
    search: '',
    results: [],
    opentalk: null,
    rus: true,
    cx: [],
    allTags: [],
    talks: {},
    words: {}
  },

  methods: {
    filter: function() {
      var result = this.filterTalks(this.search);
      if (result.length <= 20)
        this.results = result;
      else
        this.results = [];

      // Close the current talk if it is not in results.
      var foundOpenTalk = false;
      for (var i = 0; i < this.results.length; i++)
        if (this.results[i].key == this.opentalk)
          foundOpenTalk = true;
      if (!foundOpenTalk)
        this.opentalk = null;
    },

    toggleOpen: function(talk) {
      if (this.opentalk == talk)
        this.opentalk = null;
      else
        this.opentalk = talk;
    },

    speakers: function(talk) {
      return talk.speakers.map(function(s) {
        return this.rus ? s.name : s.name_en;
      }, this).join(', ');
    },

    duration: function(talk) {
      var d = talk.duration || talk.v_duration;
      if (!d)
        return this.rus ? 'Неизвестно' : 'Unknown';
      var hours = (d < 600 ? '0' : '') + Math.trunc(d/60),
          minutes = ((d%60) < 10 ? '0' : '') + (d%60);
      return hours + ':' + minutes;
    },

    formatDate: function(s) {
      // TODO
      return s;
    },

    getTags: function(talk) {
      var tags = ['cx'+talk.cx.cx];
      return tags.concat(talk.tags || []);
    },

    clickTag: function(e) {
      this.search = 't:' + e.target.innerHTML;
      this.filter();
    },

    clickPrefix: function(prefix, e) {
      this.search = prefix + ':' + e.target.innerHTML;
      this.filter();
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
      this.cx = [];

      for (var i = 0; i < data.length; i++) {
        if (!data[i].talks || data[i].talks.length == 0)
          continue;
        this.cx.push(data[i].cx);

        // First creating an lightweight Cx object that talks would reference
        var cx = {}
        for (var p in data[i]) {
          if (p != 'talks')
            cx[p] = data[i][p];
        }

        // Now let's put all talks into the array
        for (var j = 0; j < data[i].talks.length; j++) {
          var talk = data[i].talks[j],
              tkey = i+'-'+j;
          talk.cx = cx;
          talk.key = tkey;
          talks[tkey] = talk;
        }
      }
      return talks;
    },

    addKeyword: function(prefix, keyword, tkey) {
      if (!this.words[prefix])
        this.words[prefix] = {};
      if (!this.words[prefix][keyword])
        this.words[prefix][keyword] = {};
      this.words[prefix][keyword][tkey] = true;
    },

    addKeywords: function(prefix, kwstr, tkey) {
      if (!kwstr || kwstr.length <= 1)
        return;
      var parts = kwstr.toLowerCase().split(/[ ,.«»"':;]+/);
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].length == 0)
          continue;
        for (var j = 2; j <= parts[i].length; j++) {
          var word = parts[i].substr(0, j);
          if (prefix)
            this.addKeyword(prefix, word, tkey);
          this.addKeyword('all', word, tkey);
        }
      }
    },

    extractKeywords: function() {
      var tags = {};
      for (key in this.talks) {
        var talk = this.talks[key];
        if (talk.tags) {
          for (var t = 0; t < talk.tags.length; t++) {
            tags[talk.tags[t]] = (tags[talk.tags[t]] || 0) + 1;
            this.addKeyword('t', talk.tags[t], key);
          }
        }
        this.addKeywords(null, talk.title, key);
        if (talk.title_en)
          this.addKeywords(null, talk.title_en, key);
        if (talk.keywords) {
          for (var kw = 0; kw < talk.keywords.length; kw++)
            this.addKeywords(null, talk.keywords[kw], key);
        }
        for (var sp = 0; sp < talk.speakers.length; sp++) {
          this.addKeywords('a', talk.speakers[sp].name, key);
          this.addKeywords('a', talk.speakers[sp].name_en, key);
          if (sp.nickname)
            this.addKeywords('a', talk.speakers[sp].nickname, key);
        }
        if (talk.company)
          this.addKeywords('c', talk.company, key);
        this.addKeyword('t', 'cx'+talk.cx.cx, key);
        this.addKeyword('t', 'сх'+talk.cx.cx, key);
      }

      var allTags = [];
      for (var tag in tags)
        if (tags[tag] > 1)
          allTags.push(tag);
      this.allTags = allTags.sort();
    },

    filterTalks: function(str) {
      var parts = str.toLowerCase().split(/[ ,.«»"';]+/),
          prefix = 'all',
          keys = {};
      for (var p = 0; p < parts.length; p++) {
        if (parts[p].length <= 1)
          continue;
        var pref = parts[p].indexOf(':');
        if (pref > 0) {
          prefix = parts[p].substr(0, pref);
          parts[p] = parts[p].substr(pref+1);
        }
        var found = this.words[prefix] ? this.words[prefix][parts[p]] : {};
        if (p == 0) {
          if (found)
            for (var k in found)
              keys[k] = true;
        } else {
          if (!found)
            keys = {};
          else
            for (var k in keys)
              if (!found[k])
                delete keys[k];
        }
      }
      var res = [];
      for (k in keys)
        res.push(this.talks[k]);
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
