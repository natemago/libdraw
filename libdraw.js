/**
  *  LibDraw JavaScript library, version 0.2.1
  *  
  *  Licensed under GPLv3:
  *  http://www.gnu.org/licenses/gpl-3.0.html
  *
  *  Copyright 2010, Pavle Jonoski
  *
  *  Date: 7:03 PM Friday, May 14, 2010
  */
(function($){
    var seqId = 0;
    libdraw = {
        version: '0.2.1',
        description: 'LibDraw JavaScript library',
        ext:{}, // extension packages
        extend: function(extName, extension){
            var ex = typeof(extension) == 'function' ? extension.call(this, libdraw.version) : extension;
            if(ex){
                libdraw.ext[extName] = ex;
            }
        },
        getId: function(prefix){
            return (prefix || 'gen') + '-' + (seqId++);
        },
        util: {
            ns: function(name, override){
                var ts = name.split('.');
                var o = window;
                for(var i = 0; i < ts.length; i++){
                    if(!o[ts[i]] || override){
                        o[ts[i]] = {};
                    }
          	    o = o[ts[i]];
                }
            },
            each: function(col, callback){
               var  i = 0;
               for(var el in col){
                  if(col.hasOwnProperty(el)){
                     callback.call(this, col[el], i);
                  }
                  i++;
               }
            },
            ext: function(a, b){
                var oa = $.isFunction(a) ? a.prototype : a;
                var ob = $.isFunction(b) ? b.prototype : b;
                $.extend(oa, ob);
                if($.isFunction(a) && $.isFunction(b)){
                    a.superclass = ob;
                }
            },
            timer: {
                SimpleQueue: function(){
                    var q = [];
                    this.push = function(item){
                        q.push(item);
                    };
                    
                    this.pop = function(){
                        if(q.length){
                            return q.splice(0, 1);
                        }
                    };
                    
                    this.hasElements = function(){return !(!q.length);};
                    this.size = function(){ return q.length; };
                },
                Clock: function(config){
                    config = config ||{};
                    config.interval = config.interval || 50; // 20 times per second
                    
                    
                    this.ticks = 0;
                    var handlers = [];
                    var _this = this;
                    
                    var fireHandlers = function(){
                        for(var i = 0; i < handlers.length; i++){
                            handlers[i].callback.call(handlers[i].scope || this, this.ticks, handlers[i].data);
                        }
                    };

                    var tick = function(){
                        if(_this.started){
                             for(var i = 0; i < handlers.length; i++){
                                if(!_this.paused){
                                    fireHandlers.call(_this);
                                    _this.ticks++;
                                }
                             }
                        }
                    };
                    
                    this.start = function(){
                        if(!this.started){
                            this.started = true;
                            this._timerId = setInterval(tick, config.interval);
                        }
                    };
                    
                    this.stop = function(){
                        if(this.started){
                            clearInterval(this._timerId);
                            this.started = false;
                            this.ticks = 0;
                        }
                    };
                    
                    this.pause = function(){
                        this.paused = true;
                    };
                    
                    this.resume = function(){
                        this.paused = false;
                    
                    };
                    this.addHandler = function(callback, scope, data){
                        var id = libdraw.getId('clock-handler');
                        handlers.push({
                            callback: callback,
                            scope: scope,
                            data:data,
                            id: id
                        });
                        return id;
                    };
                    
                    this.removeHandler = function(id){
                        for(var i = 0; i < handlers.length; i++){
                            if(id == handlers[i].id){
                                return handlers.splice(i, 1);
                            }
                        }
                    };
                    
                    this.setInterval = function(interval){
                        if(this.started)
                           this.stop();
                        config.interval = interval;
                        if(!this.started)
                           this.start();
                    };
                    
                }
            }
        },
        Runtime: function(config){
            var self = this;
            this.clock = new libdraw.util.timer.Clock({
                interval: config.fps ? (1000/config.fps) : (1000/30) // 30fps
            });
            
            this.FPS = config.fps || 30;
            var execCallbacks = [];
            var setupCallbacks = [];
            var eventHandlers = {
               
            };
            this.id = config.id || libdraw.getId('libdraw-runtime');
	    
            this.context = config.canvas.getContext(config.graphicsType || '2d');
            this.width = config.width || 300;
            this.height = config.height || 300;
            
            var rt = {
                toString: function(){return this.self.id + ' on canvas [' + config.canvas.id + ']';},
                frameRate: function(fr){
                    self.clock.setInterval(1000/fr);
                },
                size: function(w, h){
                    self.setSize(w,h);
                },
                // date functions
                millis: function(){return this.DATE.getTime();},
                seconds: function(){return this.DATE.getSeconds();},
                minutes: function(){return this.DATE.getMinutes();},
                hours: function(){return this.DATE.getHours();},
                days: function(){return this.DATE.getDate();},
                month: function(){return this.DATE.getMonth();},
                year: function(){return this.DATE.getYear();},
                //
                
                color: function(r, g, b, a){
                    var pref = 'rgb' + (a !== undefined ? 'a' : '');
                    pref += '(' + r + ', ' + g + ', ' + b;
                    if(a !== undefined){
                        pref += ', ' + a;
                    }
                    pref += ')';
                    return pref;
                },
                background: function(r, g, b, a){
                    var r,g,b,a;
                    if(arguments.length == 1){
                        this.BACKGROUND = arguments[0];
                    }else{
                        if(arguments.length >=3){
                            var r = arguments[0];
                            var g = arguments[1];
                            var b = arguments[2];
                            var a = undefined;
                            if(arguments.length >= 4){
                                a = arguments[3];
                            }
                            this.BACKGROUND = this.color(r,g,b,a);
                        }
                    }
                    var initFill = this.FILL;
                    var initStroke = this.STROKE;
                    var initLW = this.LINE_WIDTH;
                    this.fill(this.BACKGROUND);
                    this.strokeSize(0);
                    this.rect(0,0,self.width,self.height);
                    this.fill(initFill);
                    this.strokeSize(initLW);
                },
                fill: function(){
                    if(arguments.length == 1){
                        this.FILL = arguments[0];
                    }else{
                        if(arguments.length >=3){
                            var r = arguments[0];
                            var g = arguments[1];
                            var b = arguments[2];
                            var a = undefined;
                            if(arguments.length >= 4){
                                a = arguments[3];
                            }
                            this.FILL = this.color(r,g,b,a);
                        }
                    }
                    this.ctx.fillStyle = this.FILL;
                },
                stroke: function(){
                    if(arguments.length == 1){
                        this.STROKE = arguments[0];
                    }else{
                        if(arguments.length >=3){
                            var r = arguments[0];
                            var g = arguments[1];
                            var b = arguments[2];
                            var a = undefined;
                            if(arguments.length >= 4){
                                a = arguments[3];
                            }
                            this.STROKE = this.color(r,g,b,a);
                        }
                    }
                    this.ctx.strokeStyle = this.STROKE;
                },
                strokeSize: function(n){
                    this.LINE_WIDTH = n;
                },
                setFont: function(style){
                    this.FONT_STYLE = style;
                },
                rect: function(x,y,w,h){
                    var f = this.FILL;
                    var s = this.STROKE;
                    var lw = this.LINE_WIDTH;
                    with(this.ctx){
                        fillStyle = f;
                        strokeStyle = s;
                        lineWidth = lw;
                        beginPath();
                        fillRect(x,y,w,h);
                        if(lw)
                            strokeRect(x,y,w,h);
                        closePath();
                    }
                },
                circle: function(x, y, radius){
                    var f = this.FILL;
                    var s = this.STROKE;
                    var lw = this.LINE_WIDTH;
                    with(this.ctx){
                        fillStyle = f;
                        strokeStyle = s;
                        lineWidth = lw;
                        beginPath();
                        arc(x,y,radius,0, 2*Math.PI, true);
                        closePath();
                        fill();
                        if(lw)
                            stroke();
                        
                    }
                },
                lineTo: function(x, y){
                    this.ctx.fillStyle = this.FILL;
                    this.ctx.strokeStyle = this.STROKE;
                    this.ctx.lineWidth = this.LINE_WIDTH;
                    this.ctx.lineTo(x, y);
                },
                moveTo: function(x, y){
                    this.ctx.moveTo(x, y);
                },
                begin: function(){
                  this.ctx.beginPath();
                },
                end: function(){
                    this.ctx.endPath();
                },
                close: function(){
                    this.ctx.closePath();
                },
                fillPath: function(){
                    this.ctx.fillStyle = this.FILL;
                    this.ctx.fill();
                },
                strokePath: function(){
                  this.ctx.strokeStyle = this.STROKE;
                  this.ctx.stroke();
                },
                
                complex: function(points, enclosed){

                   if(points.length > 1){
                      this.begin();
                      this.ctx.fillStyle = this.FILL;
                      this.ctx.strokeStyle = this.STROKE;
                      this.ctx.lineWidth = this.LINE_WIDTH;
                      this.moveTo(points[0][0], points[0][1]);
                      for(var i = 1; i < points.length; i++){
                         this.ctx.lineTo(points[i][0], points[i][1]);
                      }
                      if(enclosed){
                         this.ctx.lineTo(points[0][0], points[0][1]);
                      }
                      this.fillPath();
                      this.strokePath();
                      this.close();
                   }

                },
                
                text: function(str, x, y, maxWidth){
                  this.ctx.font=this.FONT_STYLE;
                  this.ctx.beginPath();
                  this.ctx.fillText(str, x, y);
                  this.ctx.closePath();
                  this.ctx.fill();
                },
                image: function(imgEl, x, y, width, height){
                    this.ctx.drawImage(imgEl, x, y, width, height);
                },
                
                scale: function(fx, fy){
                   fx = fx || 1.0;
                   fy = fy || fx;
                   this.ctx.scale(fx, fy);
                },
                FILL: 'rgb(255,255,255)',
                STROKE: 'rgb(255,255,255)',
                LINE_WIDTH: 1,
                BACKGROUND: 'rgb(255,255,255)',
                FONT_STYLE: 'bold 10px sans-serif',
                DATE: new Date(),
                ctx: self.context,
		          runtime: self,
                // debug utilz
                trace: function(msg){
                  if(libdraw._console){
                     libdraw._console.println(msg);
                  }
                },
                error: function(err){
                   if(libdraw._console){
                     libdraw._console.printerr(err);
                   }
                },
                self: self
            };
            
            
            config.canvas.libdraw_rt = rt;
            
            // events attach
            $(config.canvas).mousemove(function(e){
                rt.mouseX = e.pageX - $(this).offset().left;
                rt.mouseY = e.pageY - $(this).offset().top;
                if(self.mouseMove){
                  self.mouseMove.call(rt, rt);
                }
            });
            $(document).keydown(function(e){
               rt.keyCode = e.which;
               self.triggerRTEvent('keydown', e);
            });
            $(document).keypress(function(e){
               rt.keyCode = e.which;
               self.triggerRTEvent('keypress', e);
            });
            /*$(document).keyup(function(e){
               rt.keyCode = e.which;
               self.triggerRTEvent('keyup', e);
            });*/
            
            /// ************
            
            // this will be deprecated
            this.on = function(eventName, callback, scope){
               var hs = eventHandlers[eventName];
               if(!hs){
                  hs = [];
                  eventHandlers[eventName] = hs;
               }
               var id = libdraw.getId(eventName + '-handler');
               hs.push({
                  id: id,
                  callback: callback,
                  scope: scope
               });
               return id;
            };
            
            // this will be deprecated
            this.triggerRTEvent = function(eventName, event){
               var hs = eventHandlers[eventName];
               if(hs){
                  for(var i = 0; i < hs.length; i++){
                    var h = hs[i];
                    h.callback.call(h.scope || rt, rt, event);
                  }
               }
            };
            
            this.clearRTEvents = function(){
               eventHandlers = [];
            }
            
            this.setup = function(callback){
               var id = libdraw.getId('setup');
               setupCallbacks.push({callback: callback, id: id});
               return id;
            };
            
            this.removeSetupHandler = function(id){
               for(var i = 0; i < setupCallbacks.length; i++){
                  if(setupCallbacks[i].id == id){
                     var c = setupCallbacks.splice(i, 1);
                     return c[0].callback;
                  }
               }
               return undefined;
            };
	    
            this.removeExecHandler = function(id){
               for(var i = 0; i < execCallbacks.length; i++){
                  if(execCallbacks[i].id == id){
                     return execCallbacks.splice(i, 1)[0].callback;
                  }
               }
               return undefined;
            };
	    
            this.exec = function(callback){
               var id = libdraw.getId('exec');
               execCallbacks.push({callback: callback, id: id});
               return id;
            };
            
            var dtrace = function(msg){
                if(window.__LIBDRAW_DEBUG__){
                    trace(msg);
                }
            }
            this.extensions = {};
            this.init = function(){
                this.setSize(this.width, this.height);
                this.startup = this.startup || function(){};
                for(var i =0; i < setupCallbacks.length; i++){
                  setupCallbacks[i].callback.call(rt, rt);
                }
                dtrace('(' + this.id + '): LibDraw Runtime Initialized.');
                dtrace('(' + this.id + '): Version: ' + libdraw.version);
                dtrace('(' + this.id + '): Loaded extensions: ' + this.getLoadedExtensions());
            };
            
            this.setSize = function(w,h){
                this.width = w;
                this.height = h;
                config.canvas.width = w;
                config.canvas.height = h;
            };
            
            this.loadExtension = function(extensionName){
               var ext = libdraw.ext[extensionName];
               if(ext){
                  if(typeof(ext) == 'function'){
                     ext = ext.call(rt,rt);
                  }
                  this.extensions[extensionName] = rt[extensionName] = ext;
               }else{
                  throw new Error('The Extension [' + extensionName + '] is not registered!');
               }
            };
            
            
            
            this.clearBackground = (config.clearBackground !== undefined ? config.clearBackground : true);
            
            
            var setupFrame = function(r, tick){
               with(r){
                  DATE = new Date();
                  if(self.clearBackground)background(); // i.e clear the canvas . . .
                  r.frame = tick;
               }
            };
            
            var self = this;
            
            
            
            this.frameRendered = true;
            
            this.next = function(tick){
                if(self.frameRendered){
                   self.frameRendered = false;
                   setupFrame(rt, tick);
                   try{
                     for(var i = 0; i < execCallbacks.length; i++){
                        execCallbacks[i].callback.call(rt, rt);
                     };
                   }catch(ex){
                     rt.error(ex.message);
                     self.stop();
                   }
                   self.frameRendered = true;
                }
            };
            
            this.clock.addHandler(function(ticks){
                this.next(ticks);
            }, this);
            
            this.start = function(){
                this.clock.start();
            }
            
            this.stop = function(){
               this.clock.stop();
               this.frameRendered = true;
            }
            
            this.pause = function(){
               this.clock.pause();
               this.frameRendered = true;
            }
            
            this.resume = function(){
               this.clock.resume();
            }
            
            this.paused  = function(){
               return this.clock.paused;
            };
            
            this.started = function(){
               return this.clock.started;
            };
           
            this.bindEvent = function(event, callback, scope){
                var self = this;
                $(config.canvas).bind(event, function(){
                    var args = [];
                    for(var  i =0; i < arguments.length; i++){
                     args.push(arguments[i]);
                    }
                    args.push(rt);
                    callback.apply(scope || self, args);
                });
            };
            
            this.unbindEvent = function(event, callback){
                $(config.canvas).unbind(event, callback);
            };
            
            this.publish = function(event, customParams){
                $(config.canvas).trigger(event, customParams);
            };
            
            var _fCnt = 0;
            var _start = new Date().getTime();
            var _curr = _start;
            var _showFPS = false;
            var _p = Math.round(self.FPS/2);
            var _rfps = 0;
            this.exec(function(r){
               _fCnt++;
               with(r){
                  if((frame%_p) == 0){
                     _curr = new Date().getTime();
                     var d = _curr - _start;
                     _rfps = (_fCnt/d)*1000;
                     _rfps = Math.floor(_rfps);
                     _fCnt=0;
                     _start = _curr;
                  }
                  if(_showFPS){
                    fill(30,30,30);
                    text( _rfps + 'fps', 10, 20);
                  }
               }
               
            });
            
            this.showFps = function(s){
               _showFPS = s;
            };
            
            var wel = $(config.canvas);
            
            this.getUISpecs = function(){
               var offset = wel.offset();
               return {
                  x: offset.left,
                  y: offset.top,
                  width: this.width,
                  height: this.height
               };
            };
            
            this.getLoadedExtensions = function(){
               var ex = [];
               
               for(var e in this.extensions){
                  if(this.extensions.hasOwnProperty(e)){
                     ex.push(e);
                  }
               }
               return ex;
            };
            
            
            // let's now load the extensions
            if(config.loadExtensions && config.loadExtensions.length){
               for(var i = 0; i < config.loadExtensions.length; i++){
                  this.loadExtension(config.loadExtensions[i]);
               }
            }else{
               for(var ex in libdraw.ext){
                  if(libdraw.ext.hasOwnProperty(ex)){
                     this.loadExtension(ex);
                  }
               }
            }
            
            
            
        }
    };
      
   
   ////// DEBUG UTILITIES ///
   libdraw.util.ns('libdraw.util.other.debug');
   
   libdraw.util.other.debug.TextDisplay = function(config){
      libdraw.util.ext(this, config);
      this.mode = config.mode || 'text';
      this.name = config.name || libdraw.getId('display');
      
      this.init();
      this.setHeight(this.height || 150);
   };
   
   
   libdraw.util.ext(libdraw.util.other.debug.TextDisplay, {
      init: function(){
         if(this.selector){
            this.el = $(this.selector, this.context);
         }else if(this.el){
            this.el = $(this.el, this.context);
         }
         this.el.addClass('console-display');
      },
      print: function(msg, buffer){
         if(buffer){
            buffer.push(msg);
            return false;
         }
         this.el[0].innerHTML += msg;
         
         var ee = this.el[0];
         if(this.el[0].clientHeight != undefined){
            this.el[0].scrollTop = this.el[0].scrollHeight;
         }
      },
      println: function(msg, buffer){
         var newLine = '\n';
         if(this.mode == 'html') newLine = '<br/>';
         this.print(msg + newLine, buffer);
      },
      printerr: function(msg, buffer){
         if(this.mode == 'text'){
            msg = 'error: ' + msg;
         }else if(this.mode == 'html'){
            msg = '<span style="color: red">' + msg + '</span>';
         }
         this.println(msg, buffer);
      },
      clear: function(){
         this.el.html('');
      },
      setHeight: function(height){
         this.height = height;
         this.el.css('height', this.height);
      }
   });
   
   libdraw.util.other.debug.DebugConsole = function(config){
      libdraw.util.ext(this, config);
      this.init();
   };
   
   libdraw.util.ext(libdraw.util.other.debug.DebugConsole, {
      init: function(){
         this.el = $(this.selector);
         this.display = new libdraw.util.other.debug.TextDisplay({
            mode: this.mode || 'text',
            selector: '.text-display',
            context: this.el
         });
         
         this.closeButton = $('.close-button');
         var self = this;
         this.closeButton.click(function(){
            self.hide();
         });
         this.clearButton = $('.clear-button');
         this.clearButton.click(function(){
            self.clear();
         });
         
         var cmdText = $('.cmd-text');
         var cmdExec = $('.cmd-exec');
         var self = this;
         
         
         var msg = function(m){
            if(self.mode =='html'){
               return m.replace(/\n/gim, '<br/>').replace(/ /gim, '&nbsp;');
            }
            return m;
         };
         
         
         
         this.commands = {};
         
         var processCmd = function(inputEl, commandName, args, line){
             if(self.commands[commandName]){
                var r = self.commands[commandName].call(self, inputEl, commandName, args, line);
                return r;
             }
             return undefined;
         };
         
         var CMD = /^\:\w+/g;
         
         var print_result = function(result){
            var buffer = [];
            if(typeof(result) == 'object'){
               self.println('Object: {', buffer);
               for(var p in result){
                  self.print(' '+ p + ": ", buffer);
                  try{
                     if(typeof(result[p]) == 'function'){
                        self.println('function(..){...},', buffer)
                     }else if(typeof(result[p]) == 'string'){
                        self.println('"' + result[p] +'",', buffer)
                     }else{
                        self.println(result[p] + ",", buffer);
                     }
                  }catch(e2){
                     self.printerr('[error while examining property]', buffer);
                  }
                  
               }
               self.println('}', buffer);
             }else{
               self.println(result, buffer);
             }
             self.print(buffer.join(' '));
         };
         
         
         this.ENV = {};
         
         var onCmd = function(){
            var cmd = cmdText.length ? cmdText[0] : undefined;
            if(cmd){
               var command = x.util.trim(cmd.value);
               self.println('~$ ' + cmd.value);
               try{
                   if(x.util.startsWith(command,":")){
                      var cmdName = command.match(CMD)[0].substring(1);
                      var args = x.util.trim(command.substring(cmdName.length+1));
                      var r = processCmd.call(self, cmd, cmdName, args, command);
                      //self.println(cmdName + " (command)");
                      if(r !== undefined){
                         print_result(r);
                      }
                      cmd.value = '';
                      return;
                   }
                   var ft= '';
                   for(var c in self.ENV){
                     if(self.ENV.hasOwnProperty(c)){
                        ft+='var ' + c + ' = this.ENV.' + c + ';';
                     }
                   }
                   ft += 'return ' + cmd.value + ';';
                   var f = new Function(ft);
                   var result = f.call(this);
                   
                   print_result(result);
               }catch(ex){
                   self.printerr(ex.message);
               }
               cmd.value = '';
            }
         };
         
         var current = 0;
         
         this.history = {
            _h: [],
            down: function(el){
               if(current >= this._h.length)
                  current = this._h.length-1;
               if(this._h[current]){
                  el.value = this._h[current];
               }
               current++;
            },
            up: function(el){
               if(current <= 0)
                  current = 0;
               if(this._h[current]){
                  el.value = this._h[current];
               }
               current--;
            },
            add: function(entry){
               this._h.push(entry);
               current = this._h.length - 1;
            }
         };
         
         
         cmdText.keydown(function(e){
            if(e.which == 13){
               self.history.add(cmdText[0].value);
               onCmd.call(self);
            }else if(e.which == 38){ // up
               //debugger;
               self.history.up(cmdText[0]);
            }else if(e.which == 40){ // down
               self.history.down(cmdText[0]);
            }
            
         });
         
         cmdExec.click(function(){
            onCmd.call(self);
         });
         
         this.addCommand('lscmd', function(){
            for(var c in self.commands){
               if(self.commands.hasOwnProperty(c)){
                  self.println(c);
               }
            }
         });
         
         this.addCommand('env', function(){
            for(var c in self.ENV){
               if(self.ENV.hasOwnProperty(c)){
                  self.println(c + '=' + self.ENV[c]);
               }
            }
         });
         
         this.addCommand('set', function(el, cmd, args, line){
            var a = args.split(" ");
            if(a && a.length >= 2){
               var n = x.util.trim(a[0]);
               var v = x.util.trim(a[1]);
               self.ENV[n] = v;
               self.println(n + ' = ' + v);
            }
         });
         this.addCommand('runtimes', function(el, cmd, args, line){
            var i = 1;
            $('canvas').each(function(){
               if(this.libdraw_rt){
                  self.println(i + '. ' + this.libdraw_rt.toString());
                  i++;
               }
            });
         });
         this.addCommand('usert', function(el, cmd, args, line){
            var a = args.split(" ");

            if(a && a.length >= 1){
               var rtid = x.util.trim(a[0]);
                $('canvas').each(function(){
                if(this.libdraw_rt && this.libdraw_rt.self.id == rtid){
                  self.ENV['rt'] = this.libdraw_rt;
                  self.println('Using runtime: ' + this.libdraw_rt);
                  return false;
                }
            });
            }
         });
         
         this.addCommand('monitor', function(el, cmd, args, line){
            if($('.monitor', this.el).length == 0){
               this.el.append('<div style="width: 100%" class="monitor"/>');
            }
            var a = args.split(' ');
            if(a && a.length > 1){
               if(!self.ENV.rt){
                  self.printerr('You must select a runtime to attach monitor to.');
                  return false;
               }
               var label = x.util.trim(a[0]);
               var expression = 'return ' + x.util.trim(a[1]) + ';';
               var monitor = $('<span style="border: solid 1px gray; padding: 2px; margin: 2px;"/>');
               $('.monitor').append(monitor);
               try{
                  var f = new Function(expression);
                  var mid = self.ENV.rt.self.exec(function(){
                     try{
                     var value = f.call(self.ENV.rt);
                     monitor.html(label + ': ' + value);
                     }catch(e2){}
                  });
                  self.println('Monitor handler: ' + mid);
               }catch(e){}
            }
         });
      },
      addCommand: function(name, def){
         this.commands[name] = def;
      },
      print: function(msg, buffer){
         this.show();
         this.display.print(msg, buffer);
      },
      println: function(msg, buffer){
         this.show();
         this.display.println(msg, buffer);
      },
      printerr: function(msg, buffer){
         this.show();
         this.display.printerr(msg, buffer);
      },
      clear: function(){
         this.display.clear();
      },
      show: function(){
         this.el.css('display', 'block');
      },
      hide: function(){
         this.el.css('display', 'none');
      },
      bindTo: function(selector){
         this.selector = selector;
         this.init();
      }
      
   });
   
   libdraw.util.other.debug.DebugConsole.createDefault = function(){
      var id = libdraw.getId('libdraw-console');
      var markup = [
        '<div style="width: 100%; padding: 0px; margin: 0px; border: 0px; bottom: 0; position: absolute;">',
         '<div id="',id,'" class="console-wrapper" style="display: none; ">',
            '<div style="font: bold 14px; padding: 4px; text-align: left;">Debug Console</div>',
            '<div style="padding: 5px;">',
               '<div class="text-display" ></div>',
               '<div style="text-align: right; padding: 4px;">',
                  '<span style="text-align: right; width: 2%; background-color: #dddddd;">~$</span>',
                  '<input type="text" class="cmd-text" style="font-size: 10px; width: 83%; font-family: mono; border: none; background-color: #dddddd; color: gray;"/><input type="button" class="cmd-exec" value="Go" style="font-size: 10px; width: 5%;"/>',
                  '<input type="button" class="clear-button" style="font-size: 10px; width: 5%;" value="Clear"/>',
                  '<input type="button" class="close-button" style="font-size: 10px; width: 5%;" value="Close"/>',
               '</div>',
            '</div>',
         '</div>',
        '</div>'
      ].join('');
      document.body.appendChild($(markup)[0]);
      return new libdraw.util.other.debug.DebugConsole({
         selector: '#' + id,
         mode: 'html'
      });
   }
   
   //////////////////////////
   
   
   if(!window.console){
      console = {
         log: function(msg){
            if(libdraw._console) libdraw._console.println(msg);
         }
      };
   }
   
  
   $(document).ready(function(){
      libdraw._console = libdraw.util.other.debug.DebugConsole.createDefault();
   });
   
   
   if(window.__LIBDRAW_DEBUG__){
      trace= function(msg){
         if(libdraw._console){
            libdraw._console.println(msg);
         }else if(window.console && console.log){
            console.log(msg);
         }
       };
       error = function(err){
          if(libdraw._console){
            libdraw._console.printerr(err);
          }else if(window.console && console.log){
            console.log('ERROR(libdraw): ' + msg);
          }
       };
   }
   
   libdraw.util.other.loadImages = function(arr, callback, scope){
      var count = 0;
      var total = arr.length;
      var imgArr = [].concat(arr);
      
      var loadHandler = function(){
         count++;
         if(count == total){
            var images = {};
            for(var i = 0; i < imgArr.length; i++){
               images[imgArr[i].name] = imgArr[i].image;
            }
            callback.call(scope || window, images);
         }
      };
      
      for(var i = 0; i < arr.length; i++){
         imgArr[i].image = new Image();
         imgArr[i].image.onload = loadHandler;
      }
      
      for(var  i =0 ; i < imgArr.length; i++){

         imgArr[i].image.src = imgArr[i].src;
      }
   };
   
   
   
})(jQuery);
