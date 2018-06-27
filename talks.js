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
    words: {},
    updatingHash: false
  },

  computed: {
    dedicatedPage: function() {
      return this.$el.getAttribute('pagetitle') != 'Схемотехника';
    },

    outerCx: function() {
      var cxtitle = this.$el.getAttribute('cxtitle');
      return cxtitle ? cxtitle.match(/\d\d/)[0] : null;
    }
  },

  methods: {
    filter: function() {
      var result = this.filterTalks(this.search);
      if (result.length > this.cx.length * 1.2 && this.search.indexOf(':') <= 0)
        result = [];
      this.results = result;
      
      if (this.dedicatedPage) {
        // Update the location hash with the search string.
        this.updatingHash = true;
        window.location.hash = '#' + this.search;
        this.updatingHash = false;
      }

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

    updateFromHash: function() {
      if (this.updatingHash)
        return;
      var hash = decodeURI(window.location.hash);
      if (!hash || hash.length < 1)
        return;
      if (this.search != hash.substr(1)) {
        this.search = hash.substr(1);
        this.filter();
      }
    },

    speakers: function(talk) {
      return talk.speakers.map(function(s) {
        return this.rus ? s.name : s.name_en;
      }, this).join(', ');
    },

    duration: function(talk) {
      var d = talk.duration || talk.v_duration;
      if (!d)
        return this.rus ? 'неизвестно' : 'unknown';
      var minutes = Math.trunc(d/60),
          seconds = ((d%60) < 10 ? '0' : '') + (d%60);
      return minutes + ':' + seconds;
    },

    formatDate: function(s) {
      if (!s || s.length != 10)
        return '';
      var year = s.substr(0, 4),
          month = parseInt(s.substr(5, 2)),
          day = parseInt(s.substr(8, 2)),
          months = ['января', 'февраля', 'марта', 'апреля',
            'мая', 'июня', 'июля', 'августа', 'сентября',
            'октября', 'ноября', 'декабря'],
          months_en = ['January', 'February', 'March', 'April',
            'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'];
      return '' + day + ' ' + (this.rus ? months[month-1] : months_en[month-1])
        + ' ' + year + (this.rus ? ' года' : '');
    },

    getTags: function(talk) {
      var tags = ['cx'+talk.cx.cx];
      return tags.concat(talk.tags || []);
    },

    clickPrefix: function(prefix, e) {
      this.search = prefix + ':' + e.target.innerHTML;
      this.filter();
    },

    clickTag: function(e) {
      this.clickPrefix('t', e);
    },

    formatNumberAdj: function(n, a1, a2, a5, e1) {
      if (this.rus) {
        if (n % 10 == 1 && n % 100 != 11)
          return n + ' ' + a1;
        else if (n % 10 >= 2 && n % 10 <=4 && (n % 100 < 10 || n % 100 > 20))
          return n + ' ' + a2;
        else
          return n + ' ' + a5;
      } else {
        if (n == 1)
          return n + ' ' + e1;
        else
          return n + ' ' + e1 + 's';
      }
    },

    totalTalks: function() {
      var count = 0;
      for (var i in this.talks)
        count++;
      return count;
    },

    totalDurationHours: function() {
      var total = 0;
      for (talk in this.talks)
        total += this.talks[talk].v_duration || 0;
      return Math.round(total / 3600);
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
      var parts = kwstr.toLowerCase().replace('ё', 'е').split(/[ ,.«»"':;?!-]+/);
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
            this.addKeywords(null, talk.tags[t], key);
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
        if (talk.links)
          for (link in talk.links)
            this.addKeywords(null, link, key);
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
      var parts = str.toLowerCase().replace('ё', 'е').split(/[ ,.«»"';?!-]+/),
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
        if (found && Object.keys(found).length > 0) {
          if (p == 0 || Object.keys(keys).length == 0) {
            for (var k in found)
              keys[k] = true;
          } else {
            for (var k in keys)
              if (!found[k])
                delete keys[k];
          }
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
    this.http('/talks.json', function(data) {
      this.talks = this.processTalks(data);
      this.extractKeywords();
      if (this.search.length > 1)
        this.filter();
    });
  },

  mounted: function() {
    // Use the location hash for the search string.
    if (this.outerCx) {
      this.search = 't:cx' + this.outerCx;
      this.filter();
    } else
      this.updateFromHash();

    // When the page is rendered, focus the textfield.
    this.$refs.search.focus();

    // Listen to location hash changes.
    window.addEventListener('hashchange', this.updateFromHash);
  }
});
