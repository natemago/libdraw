/*
 * LibDraw, version 0.3.0
 *
 *
 *
 */
 
(function(){
   // enveloped variables
   var seqId = 0;
   
   
   var ugly = {
      extend:function(a,b, c){
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
                  ugly.extend(a[p],b[p],c);
               }else{
                  a[p] = b[p];
               }
            }
         }
      },
      isFunction: function(t){
         return typeof(t) == 'function';
      }
     
   };
   
   
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
            callback.call(scope, col[k], k, i);
            i++;
         }
      }
   };
   
   
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
         fontStyle: '12px sans-serif'
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
      };
      
      this.stroke = function(){
         if(arguments.length > 1)
            state.stroke = this.color.apply(this, arguments);
         else
            state.stroke = arguments[0];
      };
      
      this.strokeSize = function(s){
         state.lineWidth = s;
      };
      
      this.background = function(){
        if(arguments.length > 1){
            state.background = this.color.apply(this, arguments);
        }else{
            state.background = arguments[0];
        }
      };
      
      this.frameRate = function(fps){
        state.fps = fps;
        this.trigger('framerate', fps);
      };
      
      this.size = function(width, height){
         state.width = width;
         state.height = height;
         this.trigger('resize', width, height);  
      }
      
      
   };
   
   libdraw.util.ext(GraphicsContext, BaseObservable);
   
   
   libdraw.Runtime = function(){
      
   };
   
   
})();
