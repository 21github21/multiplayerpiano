// Generated by CoffeeScript 1.6.1
(function() {
  var ChordGenerator, Game, GameServer, MIDIUtil, app, events, express, fs, gameServer, http, io, server,
    _this = this,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  express = require('express');

  events = require('events');

  app = express();

  http = require('http');

  fs = require('fs');

  app.use('/static', express["static"](__dirname + '/static'));

  server = http.createServer(app);

  server.listen(4000);

  io = require('socket.io').listen(server);

  ChordGenerator = (function(_super) {

    __extends(ChordGenerator, _super);

    ChordGenerator.NOTES_MAJOR = [0, 4, 7];

    ChordGenerator.NOTES_MINOR = [0, 3, 7];

    ChordGenerator.ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

    ChordGenerator.TYPES = ['Major', 'Minor'];

    function ChordGenerator() {
      var _this = this;
      this.noteOff = function(note) {
        return ChordGenerator.prototype.noteOff.apply(_this, arguments);
      };
      this.noteOn = function(note) {
        return ChordGenerator.prototype.noteOn.apply(_this, arguments);
      };
      this.getRandomChord = function() {
        return ChordGenerator.prototype.getRandomChord.apply(_this, arguments);
      };
      this.target = null;
      this.notes = [];
      this.mu = new MIDIUtil;
    }

    ChordGenerator.prototype.getRandomChord = function() {
      var i, _i, _len, _ref;
      this.current = ChordGenerator.ROOTS[Math.floor(Math.random() * ChordGenerator.ROOTS.length)];
      this.currentNotes = [];
      _ref = ChordGenerator.NOTES_MAJOR;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        this.currentNotes.push(ChordGenerator.ROOTS[(ChordGenerator.ROOTS.indexOf(this.current) + i) % ChordGenerator.ROOTS.length]);
      }
      return this.current;
    };

    ChordGenerator.prototype.noteOn = function(note) {
      console.log("Note on: " + (this.mu.midiToNoteName(note)));
      this.notes.push(this.mu.midiToNoteName(note));
      console.log("Notes: " + this.notes);
      console.log("CurrentNotes: " + this.currentNotes);
      console.log("Value: " + this.arraysEqual(this.notes, this.currentNotes));
      if (this.arraysEqual(this.notes, this.currentNotes)) {
        console.log("Chord matched!");
        this.notes = [];
        return this.emit('chordMatched');
      }
    };

    ChordGenerator.prototype.noteOff = function(note) {
      var x;
      return this.notes = (function() {
        var _i, _len, _ref, _results;
        _ref = this.notes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          if (x !== this.mu.midiToNoteName(note)) {
            _results.push(x);
          }
        }
        return _results;
      }).call(this);
    };

    ChordGenerator.prototype.arraysEqual = function(a, b) {
      var x, _i, _len;
      if (!(a instanceof Array && b instanceof Array)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        x = a[_i];
        if (b.indexOf(x) < 0) {
          return false;
        }
      }
      return true;
    };

    return ChordGenerator;

  })(events.EventEmitter);

  exports.ChordGenerator = ChordGenerator;

  Game = (function(_super) {

    __extends(Game, _super);

    function Game() {
      var _this = this;
      this.end = function() {
        return Game.prototype.end.apply(_this, arguments);
      };
      this.newTurn = function() {
        return Game.prototype.newTurn.apply(_this, arguments);
      };
      this.start = function() {
        return Game.prototype.start.apply(_this, arguments);
      };
      this.addPlayer = function(player) {
        return Game.prototype.addPlayer.apply(_this, arguments);
      };
      console.log("Starting a new game.");
      this.players = [];
      this.chordGenerator = new ChordGenerator;
      this.score = 0;
      this.level = 0;
      this.timeout = null;
      this.chordGenerator.on('chordMatched', function() {
        var p, _i, _len, _ref;
        _this.level += 1;
        _this.score = _this.score + (100 * _this.level);
        _ref = _this.players;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          p.emit('gotIt');
        }
        return _this.newTurn();
      });
    }

    Game.prototype.addPlayer = function(player) {
      var _this = this;
      console.log("Adding player (game)");
      this.players.push(player);
      player.on('note_on', function(note) {
        return _this.chordGenerator.noteOn(note);
      });
      return player.on('note_off', function(note) {
        return _this.chordGenerator.noteOff(note);
      });
    };

    Game.prototype.start = function() {
      var p, _i, _len, _ref;
      console.log("Starting game.");
      _ref = this.players;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        p.emit('gameStart');
      }
      return this.newTurn();
    };

    Game.prototype.newTurn = function() {
      var p, target, _i, _len, _ref, _results;
      console.log("New turn.");
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout(this.end, 20000 - (1000 * this.level));
      target = this.chordGenerator.getRandomChord();
      console.log("Broadcasting target " + target + " to all players.");
      _ref = this.players;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        _results.push(p.emit('target', target));
      }
      return _results;
    };

    Game.prototype.end = function() {
      var p, _i, _len, _ref, _results;
      console.log("Game over; players scored " + this.score);
      _ref = this.players;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        _results.push(p.emit('gameOver', this.level, this.score));
      }
      return _results;
    };

    return Game;

  })(events.EventEmitter);

  GameServer = (function(_super) {

    __extends(GameServer, _super);

    GameServer.PLAYERS_PER_GAME = 1;

    function GameServer() {
      this.waitingroom = [];
      this.games = [];
    }

    GameServer.prototype.addPlayer = function(player) {
      var game, i, _i, _ref;
      console.log("Adding player (gameserver).");
      this.waitingroom.push(player);
      if (this.waitingroom.length >= GameServer.PLAYERS_PER_GAME) {
        game = new Game;
        for (i = _i = 1, _ref = GameServer.PLAYERS_PER_GAME; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
          game.addPlayer(this.waitingroom.pop());
        }
        return game.start();
      } else {
        return player.emit('waiting', this.waitingroom.length, GameServer.PLAYERS_PER_GAME);
      }
    };

    return GameServer;

  })(events.EventEmitter);

  MIDIUtil = (function() {

    function MIDIUtil() {}

    MIDIUtil.NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

    MIDIUtil.prototype.midiToNoteName = function(num) {
      var target;
      target = num % MIDIUtil.NOTES.length;
      return MIDIUtil.NOTES[target];
    };

    MIDIUtil.prototype.offsetFromRoot = function(root, target) {
      var end, start;
      start = MIDIUtil.NOTES.indexOf(root);
      end = MIDIUtil.NOTES.indexOf(target);
      if (end >= start) {
        return end - start;
      } else {
        return (MIDIUtil.NOTES.length - start) + end;
      }
    };

    return MIDIUtil;

  })();

  exports.MIDIUtil = MIDIUtil;

  gameServer = new GameServer;

  app.get('/', function(req, res) {
    return fs.createReadStream('./views/index.html').pipe(res);
  });

  io.sockets.on('connection', function(socket) {
    gameServer.addPlayer(socket);
    socket.on('note_on', function(note) {
      return socket.broadcast.emit('note_on', note);
    });
    return socket.on('note_off', function(note) {
      return socket.broadcast.emit('note_off', note);
    });
  });

}).call(this);
