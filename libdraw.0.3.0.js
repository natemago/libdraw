/*
 * LibDraw, version 0.3.0
 *
 *
 *
 */
 
(function(){
   // enveloped variables
   var seqId = 0;
   var __graphics = {
      supported: false,
      contextTypes: {
         '2d': false,
         'webgl': false,
         'experimental-webgl': false
      }
   };
   
   var ugly = {
      _extend:function(recursive, a,b, c){
         if(!b) return;
         a = a || {};
         c = c || {};
         
         for(var p in b){
            if(b.hasOwnProperty(p)){
               if(typeof(b[p]) == 'object'){
                  a[p] = {};
                  if(!c[b[p]])c[b[p]]=[];
                  for(var i = 0; i < c[b[p]].length; i++){
                     if(c[b[p]][i] == b[p]){
                        throw new Error('Circular reference');
                     }
                  }
                  c[b[p]].push(b);
                  if(recursive){
                     ugly.extend(a[p],b[p],c);
                  }else{
                     a[p]=b[p];
                  }
               }else{
                  a[p] = b[p];
               }
            }
         }
      },
      extendr: function(a,b,c){ugly._extend(true, a,b,c);},
      extend: function(a,b,c){ugly._extend(false,a,b,c);},
      isFunction: function(t){
         return typeof(t) == 'function';
      },
      testSupported: function(){
         clean.each(__graphics.contextTypes, function(isSupported, name){
            try{
               var c = clean.createCanvas();  
               try{
                  var ctx = c.getContext(name);
                  if(ctx){
                     __graphics.contextTypes[name] = true;
                     console.log(ctx);
                  }
               }catch(e){
                  console.log(e);
               }
            }catch(e){
               console.error(e);
               // no graphics supported
               return false;
            }
         });
      }
     
   };
   U = ugly;
   
   var clean = {
      requestAnimationFrame: (function(){
         var raf =  window.requestAnimationFrame       || 
         window.webkitRequestAnimationFrame || 
         window.mozRequestAnimationFrame    || 
         window.oRequestAnimationFrame      || 
         window.msRequestAnimationFrame ||
         function(callback, element){
            window.setTimeout(callback, 1000 / 60);
         };
         
         return function(callback, element){
            raf.call(window, callback, element);
         }
         
      })(),
      nop: function(){},
      each: function(col, callback, scope){
         scope = scope || window;
         var i = 0;
         for(k in col){
            var r = callback.call(scope, col[k], k, i);
            if(r === false)
               break;
            i++;
         }
      },
      createCanvas: function(id,x,y,width,height,position,background,visible,extraClass){
         id = id || libdraw.getId('canvas');
         
         var canvas = document.createElement('canvas');
         canvas.id = id;
         canvas.className = extraClass || '';
         if(position){
            canvas.style.position = position;
         }
         if(x){
            canvas.style.left=x+'px';
         }
         if(y){
            canvas.style.top=y+'px';
         }
         if(width){
            canvas.style.width=width;
         }
         if(height){
            canvas.style.height=height;
         }
         if(background){
            canvas.style.background=background;
         }
         if(!visible){
            canvas.style.display='none';
         }
         return canvas;
      },
      canCreateGraphics: function(){
         return __graphics.supported;
      },
      getSupportedGraphics: function(){
         var supported = [];
         clean.each(__graphics.contextTypes, function(isSupported, name){
            if(isSupported)
               supported.push(name);
         });
         return supported;
      }
   };
   
   C = clean;
   
   var necessary = {
      measure: function(task, repetitions, runs){
         
         var f = task || "";
         var n = repetitions || 100000;
         runs = runs || 10;
         
         var scope = {};
         if(ugly.isFunction(f)){
            scope.task = f;
         }
         scope.n = n;
         var fm =          ['while(this.n--){'];
         if(scope.task)fm.push('this.task.call(window);');
         else          fm.push(f);
         fm.push(           '}');
         
         var result = {
            success: true
         };
         
         try{
            var exf = new Function(fm.join(''));
            
            for(var i= 0; i < runs; i++){
               scope.n = n;
               var start = new Date().getTime();
               exf.call(scope);
               var  end = new Date().getTime();
               result.runs = result.runs || [];
               result.runs.push({
                  start: start,
                  end: end,
                  execTime: (end-start),
                  avg: (end-start)/n,
                  run: i
               });
            }
            result.total = {
               runs: runs,
               totalTime: 0,
               avgTimeRun: 0,
               avg: 0
            };
            
            
           
            
            result.runs.sort(function(a,b){
               return a.execTime - b.execTime;
            });
            var min = undefined;
            var max = undefined;
            
            if(result.runs.length%2){
               // odd
               result.total.median = result.runs[Math.ceil(result.runs.length/2)].avg;
            }else{
               // even
               var a = result.runs[result.runs.length/2-1].avg;
               var b = result.runs[result.runs.length/2].avg;
               result.total.median = (a+b)/2;
            }
            
            if(runs >1){
               min = result.runs.splice(0,1)[0];
               max = result.runs.splice(result.runs.length-1, 1)[0];
            }
            
            
            
            for(var i = 0; i < result.runs.length; i++){
               result.total.totalTime += result.runs[i].execTime;
            }
            result.total.mean = (result.total.totalTime/result.runs.length)/n;
            
            if(result.runs.length == 0){
               result.total.totalTime = min.execTime + max.execTime;
            }
            result.total.avgTimeRun = result.total.totalTime/runs;
            result.total.avg = result.total.totalTime/(runs*n);
            result.total.min = min.avg;
            result.total.max = max.avg;
            
            var v = 0;
            for(var  i = 0; i < result.runs.length; i++){
               
               var t = result.runs[i].avg - result.total.mean;
               v+=t*t;
            }
            result.total.variance = v/(result.runs.length-1);
            result.total.stdErr  = Math.sqrt(result.total.variance/result.runs.length);
            
            if(runs > 1)
               result.runs = [min].concat(result.runs).concat(max);
            
            result.runs.sort(function(a,b){
               return a.run - b.run;
            });
            
            
         }catch(e){
            result.success = false;
            result.error = e.message;
         }
         return result;
      }
   };
   N = necessary;
   // libdraw namespace:
   
   
   // this object will be registered on window scope...
   var _LD = function(){};
   
   libdraw = {
        version: '0.3.0',
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
            _extend: function(a, b){
               var oa = ugly.isFunction(a) ? a.prototype : a;
               var ob = ugly.isFunction(b) ? b.prototype : b;
               ugly.extend(oa, ob);
               if(ugly.isFunction(a) && ugly.isFunction(b)){
                   a.superclass = ob;
               }
            },
            ext: function(){
               if(arguments.length == 1){
                  return arguments[0];
               }else if(arguments.length > 1){
                  var a = arguments[0];
                  var b = arguments[1];
                  
                  libdraw.util._extend(a,b);
                  
                  for(var i = 2; i < arguments.length; i++){
                     var c = arguments[i];
                  
                     if(typeof(c) == 'function'){
                        c = c.prototype;
                     }
                  
                     if(typeof(c) == 'object'){
                        libdraw.util._extend(a,c);
                     }
                  }
                  return a;
               }
               return undefined;
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
                  var self = this;
                  config = config ||{};
                  var interval = config.interval || 50; // 20 times per second
                  
                  /*
                  * 3 modes of operation:
                     'interval' - using 'setInterval(tick, int_ms)', assuring 
                                 that the 'tick' will be called at the int_ms
                                 interval as precisely as the browser allows.
                     'timeout'  - using setTimeout(..) - the next tick will be 
                                 scheduled after 'tick' has executed. No 
                                 guarantee whatsoever about the interval and
                                 the clock speed. Use clock.getEstimatedSpeed()
                                 to get the estimated frequency of the clock (in Hz)
                     'frame'   - using the experimental 'requestAnimationFrame'
                  */
                  var mode = config.mode || 'interval';
                  var tick = {};
                  var onTick = clean.nop;
                  
                  // statistics
                  var s = {
                     range: config.range || 1000, // range in ms
                     c: {},
                     a: undefined,
                     begin: function(ts){
                        this.c.total = 0;
                        this.c.start = ts;
                        this.a = undefined;
                     },
                     update: function(ts){
                        this.c.total++;
                        if((ts - this.c.start) >= this.range){
                           this.measure(ts);
                        }
                     },
                     measure: function(ts){
                        
                        this.a = this.c;
                        this.a.end = ts;
                        this.c = {
                           start: ts, 
                           total: 0
                        };
                     },
                     getStats: function(){
                        if(this.a){
                           if(this.a.calculated){ 
                              return this.a;
                           }else{
                              this.a.expectedRange = this.range;
                              this.a.range = this.a.end - this.a.start;
                              this.a.avgCycleTime = this.a.range/this.a.total;
                              this.a.frequency = 1000/this.a.avgCycleTime; // in Hz
                              var s = [
                                 this.a.frequency, 'Hz; ',
                                 't0: ', this.a.start, '; ',
                                 't1: ', this.a.end , '; ',
                                 'Cta: ', this.a.avgCycleTime, 'ms;'
                              ].join('');
                              this.a.toString = function(){
                                 return s;
                              };
                              this.a.calculated = true;
                              return this.a;
                           }
                        }else{
                           return {
                              toString: function(){return "Clock stats N/A";}
                           };
                        }
                     }
                  };
                  
                  tick.update = function(){
                     if(self.started){
                        var date = new Date();
                        var timestamp = date.getTime();
                        for(var i = 0; i < handlers.length; i++){
                           if(!self.paused){
                              fireHandlers.call(self, timestamp, date);
                              self.ticks++;
                           }
                        }
                        s.update(timestamp);
                        return true;
                     }
                     return false;
                  };
                  tick.timeout = function(){
                     if(tick.update()){
                        setTimeout(tick.timeout, interval);
                     }
                  };
                  tick.frame = function(){
                     if(tick.update()){
                        clean.requestAnimationFrame(tick.frame, config.element);
                     }
                  };
                  
                  tick.interval = function(){
                     self._timerId = setInterval(tick.update, interval);
                  };
                  
                  this.setMode = function(m){
                     mode = m;
                     onTick = tick[mode];
                  };
                  this.getMode = function(){return mode;};
                  
                  
                  
                  this.ticks = 0;
                  var handlers = [];
                  
                  
                  var fireHandlers = function(){
                     for(var i = 0; i < handlers.length; i++){
                           handlers[i].callback.call(handlers[i].scope || this, this.ticks, handlers[i].data);
                     }
                  };

                  
                  this.start = function(){
                     this.started = true;
                     s.begin(new Date().getTime());
                     onTick.call(tick);
                  };
                  
                  this.stop = function(){
                     if(this.started){
                           if(mode == 'interval')
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
                  
                  this.setInterval = function(ms){
                     interval = ms;
                     if(mode == 'interval'){
                        clearInterval(this._timerId);
                        this._timerId = setInterval(onTick, interval);
                     }
                  };
                  
                  this.toString = function(){
                     return "Clock @" + (1000/interval) + "Hz. S(" + s.getStats()+")";
                  };
                  
                  this.getMeasure = function(){
                     return s.getStats();
                  }
                  
                  this.setMode(mode);
                }
            }
        }
   };
   
   /**
    * Base class for initializing objects
    *
    */
   var InitializingObject = function(config){
      libdraw.util.ext(this, config);
      this.init();
   };
   libdraw.util.ext(InitializingObject,{
      init: clean.nop 
   });
   
   
   var BaseObservable = function(config){
      BaseObservable.superclass.constructor.call(this, config);
   };
   
   libdraw.util.ext(BaseObservable, InitializingObject, {
      init: function(){
         this.el = this.el || {};
         this.listeners = {};
      },
      addListener: function(name, callback, scope){
         scope = scope || this;
         var wrapper = function(){
            callback.apply(scope, arguments);
         };
         $(this.el).bind(name, wrapper);
         var ls = this.listeners[name];
         if(!ls)
            ls = this.listeners[name] = {};
         ls[callback] = wrapper;
      },
      removeListener: function(name, callback){
         var ls = this.listeners[name];
         if(ls){
            if(callback){
               var wrapper = ls[callback];
               if(wrapper){
                  $(this.el).unbind(name, wrapper);
               }
            }else{
               $(this.el).unbind(name);
            }
         }
      },
      trigger: function(){
         var name = arguments[0];
         if(!name || !this.listeners[name])
            return;
            
         var data = [];
         for(var i = 1; i < arguments.length;i++){
            data.push(arguments[i]); // FIXME: ugly ugly!!!
         }
         $(this.el).trigger(name, data);
      }
   });
   
   
   var GraphicsContext = function(config){
      GraphicsContext.superclass.constructor.call(this, config);
      var state = {
         fill: 'rgba(0,0,0,0)',
         stroke: 'rgba(0,0,0,0)',
         lineWidth: 0,
         width: 300,
         height: 225,
         background: 'rgba(0,0,0,0)',
         fontStyle: '12px sans-serif',
         canvas: config.canvas
      };
      
      this.graphicsType = config.graphicsType || '2d';
      
      this.extend = function(extension){
         if(typeof(extension) == 'function'){
            extension.call(this, state, config);
            return true;
         }else if(typeof(extension) == 'object'){
            libdraw.util.ext(this,extension);
            return true;
         }
         return false;
      };
      
      this.toString = function(){
         return "LibDraw Graphics Context: [ graphics type: " + this.graphicsType + "; context: " + this.ctx + "; ]";
      };
      
      
      this.color = function(r, g, b, a){
           var pref = 'rgb' + (a !== undefined ? 'a' : '');
           pref += '(' + r + ', ' + g + ', ' + b;
           if(a !== undefined){
               pref += ', ' + a;
           }
           pref += ')';
           return pref;
       };
      
      // build the context
      this.ctx = config.canvas.getContext(this.graphicsType);
      
      // build state
      libdraw.util.ext(state, (config.state || {}));
      
      // -------------- graphics functions ---------------//
      
      this.fill = function(){
         if(arguments.length > 1)
            state.fill = this.color.apply(this, arguments);
         else
            state.fill = arguments[0];
         this.ctx.fillStyle = state.fill;
      };
      
      this.stroke = function(){
         if(arguments.length > 1)
            state.stroke = this.color.apply(this, arguments);
         else
            state.stroke = arguments[0];
         this.ctx.strokeStyle = state.stroke;
      };
      
      this.strokeSize = function(s){
         state.lineWidth = s;
         this.ctx.lineWidth = state.lineWidth;
      };
      
      this.cap = function(cap){
         // "butt", "round", "square" (default "butt")
         state.cap = cap;
         this.ctx.lineCap = cap;
      };
      
      this.lineJoin = function(type){
         // "round", "bevel", "miter" (default "miter")
         state.lineJoin = type;
         this.ctx.lineJoin = type;
      };
      
      this.setFont = function(fontStyle){
         state.fontStyle = fontStyle;
         this.ctx.font = fontStyle;
      };
      
      this.background = function(){
         var background = undefined;
         if(arguments.length > 1){
            background = this.color.apply(this, arguments);
         }else{
            background = arguments[0];
         }
         if(state.background != background){
            state.canvas.style('background', background);
            state.background = background;
         }
         this.ctx.clearRect(0,0,state.width, state.height);
      };
      
      
      
      this.rect = function(x,y,w,h){
         this.ctx.beginPath();
         this.ctx.fillRect(x,y,w,h);
         if(state.lineWidth)
            this.ctx.strokeRect(x,y,w,h);
         this.ctx.closePath();
      };
      
      this.circle = function(x,y,r){
         this.ctx.beginPath();
         this.ctx.arc(x,y,r,0, 2*Math.PI, true);
         this.ctx.fill();
         if(state.lineWidth)
            this.ctx.stroke();
         this.ctx.closePath();
      }
      
      
      this.frameRate = function(fps){
        state.fps = fps;
        this.trigger('framerate', fps);
      };
      
      this.size = function(width, height){
         state.width = width;
         state.height = height;
         this.trigger('resize', width, height);
      };
      
      this.update = function(){
         // update the time for example...
         state.DATE = new Date();
      };
      
      // date functions
      this.millis  = function(){return state.DATE.getTime();};
      this.seconds = function(){return state.DATE.getSeconds();};
      this.minutes = function(){return state.DATE.getMinutes();};
      this.hours   = function(){return state.DATE.getHours();};
      this.days    = function(){return state.DATE.getDate();};
      this.month   = function(){return state.DATE.getMonth();};
      this.year    = function(){return state.DATE.getYear();};
      //
      
      
   };
   
   libdraw.util.ext(GraphicsContext, BaseObservable);
   
   
   var Canvas = function(config){
      Canvas.superclass.constructor.call(this, config);
   };
   libdraw.util.ext(Canvas, BaseObservable,{
      init: function(){
         Canvas.superclass.init.call(this);
         this._el = $(this.el);
      },
      getPosition:function(){
         var o = this._el.offset();
         return {
            x: o.left,
            y: o.top
         };
      },
      getSize: function(){
         return {
            width: this._el.width(),
            height: this._el.height()
         };
      },
      move: function(x,y){
         this._el.offset({
            top: y,
            left: x
         });
         this.trigger('move',x,y);
      },
      resize: function(width, height){
         //this._el.width(width).height(height);
         this._el[0].width = width;
         this._el[0].height = height;
         this.trigger('resize', width, height);
      },
      getContext: function(type){
         return this.el.getContext(type);
      },
      focus: function(f){
         f = !(!f);
         this.focused = f;
         this.trigger(f?'focus':'blur');
      },
      style: function(prop, val){
         this.el.style[prop]=val;
      }
   });
   
   var Layer = function(config){
      Layer.superclass.constructor.call(this, config);
   };
   
   libdraw.util.ext(Layer, BaseObservable, {
      init: function(){
         Layer.superclass.init.call(this);
         if(this.timerSpec && !this.timerSpec.onDemand){
            if(this.timerSpec.onDemand){
               this.onDemand = true;
            }else if(this.timerSpec.clock){
               this.clock = this.timerSpec.clock;
            }else{
               this.clock = new libdraw.util.timer.Clock({
                  interval: this.timerSpec.interval,
                  mode: this.timerSpec.mode,
                  element: this.timerSpec.element || document
               });

            }
         }
         
         
         // add the handler
         this.clock.addHandler(this.cycle, this);         
                  
         this.handlers = [];
         
         var uiSpec = this.spec;
         var element = this.bindToEl;
         var canvas = undefined;
         
         if(element){
            if(element.nodeName != 'CANVAS'){
               uiSpec.x = $(element).offset().left;
               uiSpec.y = $(element).offset().top;
               uiSpec.width = $(element).width();
               uiSpec.height = $(element).height();
               canvas = clean.createCanvas(element.id, uiSpec.x, uiSpec.y, 
                  uiSpec.width, uiSpec.height, 'absolute', element.className);
            }else{
               canvas = element;
            }
         }
         ;
         this.canvas = new Canvas({
            el: canvas
         });
         
         this.canvas.resize(uiSpec.width, uiSpec.height);
         this.context = new GraphicsContext({
            graphicsType: uiSpec.graphics,
            canvas: this.canvas
         });
      },
      cycle: function(tick){
         if(this.drawing){
            return; // still drawing previous cycle - FPS will drop... (could happen for mode 'interval' or 'on-demand')
         }
         this.context.update();
         this.drawing = true;
         for(var i = 0; i < this.handlers.length; i++){
            try{
               this.handlers[i].call(this.context, this.context, tick, this.runtime);
            }catch(e){
               if(this.runtime.error(e, this, this.handlers[i], tick) === false){
                  this.clock.stop();
                  break;
               }
            }
         }
         this.drawing = false;
      },
      start: function(){
         if(!this.onDemand)
            this.clock.start()
      },
      stop: function(){
         if(!this.onDemand)
            this.clock.stop()
      },
      pause: function(){
         if(!this.onDemand)
            this.clock.pause();
      },
      resume: function(){
         if(!this.onDemand)
            this.clock.resume();
      },
      invalidate: function(){
         if(this.onDemand)
            this.cycle(0);
      },
      schedule: function(handler){
         this.handlers.push(handler);
      },
      remove: function(handler){
         var index = -1;
         clean.each(this.handlers, function(h, i){
            if(h == handler){
               index = i;
               return false;
            }
         });
         this.handlers.splice(index, 1);
      }
   });
   
   
   var Runtime = R = function(config){
      Runtime.superclass.constructor.call(this, config);
   };
   
   libdraw.util.ext(Runtime, BaseObservable, {
      init: function(){
         Runtime.superclass.init.call(this);
         this.layers = new function(){
            var layers = [];
            var nameIndex = {};
            var _sorter = function(a,b){
               return a.index-b.index;
            };
            this.add = function(l){
               l.index = l.index || 0;
               if (! (l.name in nameIndex) ){
                  layers.push(l);
                  layers.sort(_sorter);
                  return l;
               }
               return false;
            };
            
            this.remove = function(l){
               if (!l) return;
               if( l.name in nameIndex){
                  for(var i = 0; i < layers.length; i++){
                     if(layers[i] == l){
                        layers.splice(i,1);
                        break;
                     }
                  }
                  delete nameIndex[l.name];
               }
            };
            
            this.each = function(callback, scope){
               clean.each(layers, callback, scope);
            };
            
            this.size = function(){
               return layers.length;
            };
            
            this.get = function(param){
               if(typeof(param) == 'string') return nameIndex[param];
               if(typeof(param) == 'number') return layers[param];
               return undefined;
            };
         };
         
         this.cache = {
            byId: {},
            byHandler: {}
         };
         
         // the 'master' clock
         var masterClock = this.clock;
         
         this.clock = new libdraw.util.timer.Clock({
            interval: masterClock.interval || 1000/30, // 30 FPS,
            mode: masterClock.mode || 'interval',
            element: masterClock.element || document // if 'animation-frame' requested...
         });
         // default layer
         this.defaultLayer = this.layer({
            name: 'default',
            index: 0,
            spec: this.spec,
            bindToEl: this.spec.canvas,
            timer: {
               clock: this.clock
            }
         });
         
         this.errHandlers = [];
         
         // extensions init ...
         var extensions = this.extensions;
         if(extensions){
            for(var i = 0; i < this.extensions.length; i++){
               this.loadExtension(extensions[i]);
            }
         }else{
            // load all ...
            clean.each(libdraw.ext, function(v,k){
               this.loadExtension(k);
            }, this);
         }
         
      },
      /*
      config = {
         name: 'string',
         index: numeric,
         bindToEl: HTMLElement,
         spec:{ (optional) - if not specified use global ui specification, will create new canvas though
            x: numeric,
            y: numeric,
            width: numeric,
            height: numeric
         },
         timer:{ (optional) - if not specified, use master-clock
            interval: numeric,
            mode: 'interval|timeout|frame',
            element: HTMLElement (optional),
            clock: libdra.util.timer.Clock (optional) - only if you want to use specific clock
         }
      }
      
      */
      layer: function(config){
         if(config===undefined){
            return this.layers.get(0);
         }
         if(typeof(config) == 'string' || typeof(config) == 'number')
            return this.layers.get(config);
         var layer = this.layers.add(new Layer({
            name: config.name,
            index: config.index,
            spec: config.spec, // TODO: merge with existing one...
            timerSpec: config.timer, 
            clock: config.timer ? undefined : this.clock,
            bindToEl: config.bindToEl,
            runtime: this
         }));

         return layer;
      },
      register: function(callback, layer){
         var id = libdraw.getId('hnd');
         var layer = this.layers.get(layer);
         if(!layer)layer=this.layer();
         var co = {
            id: id,
            callback: callback,
            layer: layer
         };
         
         this.cache.byId[id] = co;
         this.cache.byHandler[callback] = co;
         
         layer.schedule(callback);
         
         return id;
      },
      unregister: function(callback){
         var co = undefined;
         if(typeof(callback) == 'string'){
            co = this.cache.byId[callback];
         }else if(typeof(callback) == 'function'){
            co = this.cache.byHandler[callback];
         }
         if(co){
            co.layer.remove(co.callback);
            delete this.cache.byId[co.id];
            delete this.cache.byHandler[co.callback];
         }
      },
      
      start: function(){},
      stop: function(){},
      pause: function(){},
      resume: function(){},
      
      loadExtension: function(extension){
         var ext = libdraw.ext[extension];
         if(ext){
            if (! this.extensions){
               this.extensions = [];
            }
            var extObj = undefined;
            if ( ugly.isFunction(ext) ){
               extObj = ext.call(this);
            }else{
               extObj = ext;
            }
            var name = extObj && extObj.name ? extObj.name: extension;
            var description = extObj && extObj.description ? extObj.description: 'none';
            
            if(extObj && typeof(extObj) == 'object'){
               delete extObj.name;
               delete extObj.description;
               libdraw.util.ext(this, extObj);
               extObj.name = name;
               extObj.description = description;
            }
            
            this.extensions.push({
               name: name,
               description: description, 
               extension: ext
            });
         }else{
            throw new Error('Extension '+extension+' is not registered.')
         }
      },
      
      getMetrics: function(){},
      getMeasures: function(){},
      
      error: function(err, layer, callback, tick){
         var retVal = undefined;
         for(var i = 0; i < this.errHandlers.length; i++){
            if(!this.errHandlers[i].layer || this.errHanlders[i].layer == layer.name){
               retVal = retVal || this.errHandlers[i].handler.call(this, err, layer, callback, tick);
            }
         }
         return retVal;
      },
      
      errHandler: function(handler, layer){
         this.errHandlers.push({
            handler: handler,
            layer: layer
         });
      }
   });
   
   
   
   
   /* -------------------------------- 
      ---- DEV EXTENSION -------------
      -------------------------------- */
   
   // this gets called at this point and the extension is being registered at
   // the extension packages...
   libdraw.extend('dev-ext', function(ldVersion){
      // ldVersion - you can check here for compatibility
      
      return function(){
         // the scope of this function is the Runtime object
         var hnd = clean.nop;
         
         if(window.console){
            hnd = function(ex, layer, callback, tick){
               console.log('ERROR: +',tick,
                  ' Layer -> ',layer.name,'; ', callback,', error ->', ex );
               return false; // stop the clock on this layer.
            };
         }
         
         this.errHandler(hnd);
                  
         // if an object id being returned, the runtime instance is extended with it
         return {};
      }
   });
   
   
})();
