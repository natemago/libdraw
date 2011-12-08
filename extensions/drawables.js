/**
 * 
 */
 
 /* TODO:
  * 1. Cleanup the "events" mess!
  * 2. Dragging issue - Drawables-manager should handle this!
  * 3. Drop locations!!!
  * 4. Write some documentation
  */

(function(){
    if(window.libdraw){
        var dwid = function(pref){
            return libdraw.getId(pref || 'ext-drw');
        };
        libdraw.util.ns('ld.ext.drawables');
        
        // utilities here
        ld.ext.drawables.utils = {
           pointInside:{
               // assumes x,y,width & height defined in the component
               RECTANGLE: function(x,y){
                  return x >= this.x && y >= this.y &&
                         x <= (this.x+this.width) && y <= (this.y+this.height);
               },
               // assumes: x,y and r - radius
               CIRCLE: function(x,y){
                  return (this.x-x)*(this.x-x)+(this.y-y)*(this.y-y) >= this.r*this.r;
               },
               
               // assumes array points
               POLYGON: function(x,y){
                  return false;
               },
               POLYGON_WINDING_NUMBER: function(x,y){
                  return false;
               }
           }
           
        };
        
        
        var PriorityQueue = function(config){
            var q = [];
            this.defaultPriority = config.defaultPriority != 'undefined' ? config.defaultPriority : 10;
            var sorter = function(a,b){
                return (a.priority - b.priority);
            };
            
            this.push = function(item, priority, id){
                q.push({
                    id: id || dwid('pq'),
                    item:item,
                    priority: priority || this.defaultPriority
                });
                q.sort(sorter);
                return id;
            };
            
            this.pop = function(){
                if(q.length){
                    return q.splice(0, 1)[0].item;
                }
            };
            
            this.remove = function(id){
                for(var i = 0; i < q.length; i++){
                    if(q[i].id == id){
                        q.splice(i,1);
                        break;
                    }
                }
                q.sort(sorter);
            };
            
            this.setPriority = function(id, newPriority){
                for(var i = 0; i < q.length; i++){
                    if(q[i].id == id){
                        q[i].priority = newPriority;
                        break;
                    }
                }
                q.sort(sorter);
            };
            
            this.hasElements = function(){return !(!q.length);};
            this.size = function(){ return q.length; };
            this.each = function(callback){
                for(var  i = 0; i < q.length; i++){
                    callback.call(this, q[i].item, i);
                }
            }
        };
        

        
        var DrawablesManager = function(ldrt){
            var components = {};
            var visibles = new PriorityQueue(5);
            
            var runtime = ldrt;
            
            this.invalidated = false;
            
            this.invalidate = function(){
               this.invalidated = true;
            };
            
            this.register = function(cmp){
                if(cmp.id){
                    components[cmp.id] = cmp;
                }
            };
            
            this.remove = function(cmp){
                var id = cmp.id || cmp;
                cmp = components[id];
                if(cmp){
                    // TODO: Remove any events attached to this component
                    delete components[id];
                }
            };
            
            this.get = function(id){
                return components[id];
            };
            
            this.display = function(cmp, zIndex){
                if(typeof(cmp) == 'string'){
                    cmp = this.get(cmp);
                }
                if(cmp && cmp.id){
                    visibles.push(cmp, zIndex, cmp.id);
                }
            };
            
            this.close = function(cmp){
                if(typeof(cmp) == 'string'){
                    cmp = this.get(cmp);
                }
                if(cmp && cmp.id){
                    visibles.remove(cmp.id);
                }
            };
            
            this.setZIndexTo = function(cmp, zIndex){
                //debugger;
                if(typeof(cmp) == 'string'){
                    cmp = this.get(cmp);
                }
                if(cmp && cmp.id){
                    visibles.setPriority(cmp.id, zIndex);
                }
            };
            
            this.eachInScope = function(callback){
                visibles.each(callback);
            };
            
            this.each = function(callback){
                for(var id in components){
                    if(components.hasOwnProperty(id)){
                        callback.call(this, components[id], id);
                    }
                }
            };
            
            this.on = function(eventName, callback, scope){
                runtime.self.bindEvent(eventName, callback, scope);
            };
            
            this.publish = function(event, params){
                runtime.self.publish(event, params);
            };
            
            this.removeHandler = function(event, handler){
                runtime.self.unbind(event, handler);
            };
            
            this.getUISpecs = function(){return runtime.self.getUISpecs();};
            
            // Let's make some initial bindings to the 
            // LibDraw Runtime and the underlying CANVAS DOM element
            
            // Mouse events:
            var me = 'click dblclick focusin focusout hover mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup toggle'.split(' ');
            var self = this;
            libdraw.util.each(me, function(eventName){
                  //console.log('Bound event: '+ eventName);
                  runtime.self.bindEvent(eventName, function(event, params){
                     var uiSpecs = runtime.self.getUISpecs();
                    
                     var x = event.pageX - uiSpecs.x;
                     var y = event.pageY - uiSpecs.y;
                     var topCmpId = {id:undefined, zIndex: undefined};
                     self.eachInScope(function(cmp){
                        if(cmp.pointInside(x,y)){
                           if(topCmpId.zIndex === undefined){
                              topCmpId.zIndex = cmp.getZIndex();
                              topCmpId.id = cmp.id;
                           }else{
                              if(topCmpId.zIndex <= cmp.getZIndex()){
                                 topCmpId.zIndex = cmp.getZIndex();
                                 topCmpId.id = cmp.id;
                              }
                           }
                        }
                     });
                     
                     
                     
                     self.eachInScope(function(cmp){
                        cmp.callEvent(event, eventName, 'mouse', cmp.id == topCmpId.id, params);
                     });
                   
                  } , this);
            });
            
            
            var invClock = new libdraw.util.timer.Clock({
               interval: 10 // 10ms
            });
            invClock.addHandler(function(tick){
               if(this.invalidated && !ldrt.self.started()){
                     this.invalidated = false;
                     ldrt.self.next(tick);
               }
            },this);
            invClock.start();
            
            var dragState = {
               components:{},
               dropLocations: [],
               dragging: false
            };
            
            this.startDragging = function(cmp,event){
               if(!dragState.components[cmp.id] && components[cmp.id]){
                  dragState.components[cmp.id] = cmp;
                  dragState.dragging = true;
                  var uiSpecs = runtime.self.getUISpecs();
                  var x = event.pageX - uiSpecs.x;
                  var y = event.pageY - uiSpecs.y;
                  cmp.dragging = true;
                  cmp.trigger('startdrag', [x,y,event]);
                  console.log('Star dragging cmp: ' + cmp.id);
               }
            };
            
            
            this.endDragging = function(cmp, event){
               if(dragState.components[cmp.id]){
                  var uiSpecs = runtime.self.getUISpecs();
                  var x = event.pageX - uiSpecs.x;
                  var y = event.pageY - uiSpecs.y;
                  
                  delete dragState.components[cmp.id];
                  cmp.dragging = false;
                  var i = 0;
                  for(var c in dragState.components){
                     if(dragState.components.hasOwnProperty(c))
                        i++;
                  }
                  if(i == 0){
                     dragState.dragging = false;
                  }
                  
                  dragState.dropLocations.sort(function(a,b){return a.priority-b.priority;});
                  
                  for(i =0; i < dragState.dropLocations.length; i++){
                     if(dragState.dropLocations[i].pointInside(x,y)){
                        cmp.trigger('dropped', [x,y,event,dragState.dropLocations[i]]); // dropped to
                        dragState.dropLocations[i].trigger('dropped', [x,y,event, cmp]); // dropped into
                        break;
                     }
                  }
                  cmp.trigger('drag-end', [x,y,event]);
                  console.log('End dragging cmp: ' + cmp.id);
               }
            };
            $(document).bind('mouseup', function(event){
               var uiSpecs = runtime.self.getUISpecs();
                    
               var x = event.pageX - uiSpecs.x;
               var y = event.pageY - uiSpecs.y;
               
              for(var cmp in dragState.components){
                  if(dragState.components.hasOwnProperty(cmp)){
                     self.endDragging(dragState.components[cmp], event);
                     break;
                     // TODO: bad handling
                  }
              }
            });
            this.addDropLocation = function(cmp){
               if(components[cmp.id]){
                  cmp.dropLocation = true;
                  dragState.dropLocations.push(cmp);
               }
            };
            this.removeDropLocation = function(cmp){
               for(var i; i < dragState.dropLocations.length; i++){
                  if(dragState.dropLocations[i].id == cmp.id){
                     dragState.dropLocations.splice(i,1);
                     cmp.dropLocation = false;
                     return true;
                  }
               }
               return false;
            };
        };
        /**
          * Base Managed Object class
          * All Drawables extend this class . . .
          */
        ld.ext.drawables.Base = function(config){
            libdraw.util.ext(this, config);
            this.id = this.id || dwid();
            this.uiManager.register(this);
            this.init();
        };
        libdraw.util.ext(ld.ext.drawables.Base, {
            init: function(){},
            destroy: function(){
                this.uiManager.remove(this);
            }
        });
        
        ld.ext.drawables.EventSupport = function(config){
            this.events = {};
            ld.ext.drawables.EventSupport.superclass.constructor.call(this, config);
        };
        libdraw.util.ext(ld.ext.drawables.EventSupport, ld.ext.drawables.Base);
        libdraw.util.ext(ld.ext.drawables.EventSupport,{
            addListener: function(event, callback){
                var eventName = event.toLowerCase() + '-' + this.id;
                if(!this.events[eventName]) this.events[eventName] = {};
                callback.id = dwid('hnd');
                var wrapper = this.events[eventName][callback.id] = function(){
                  var a = arguments;
                  var args = [event];
                    for(var  i =0; i < arguments.length; i++){
                     args.push(arguments[i]);
                    }
                  //console.log('handled event: '+eventName + '; args=' + args);
                  callback.apply(this, args);
                };
                
                this.uiManager.on(eventName, wrapper, this);
            },
            removeListener: function(event, callback){
                var eventName = event.toLowerCase() + '-' + this.id;
                if(this.events[eventName] && callback.id){
                  var clbck = this.events[eventName][callback.id];
                  if(clbck){
                     this.uiManager.removeHandler(eventName, clbck);
                  }
                }
                
            },
            trigger: function(event, params){
                var eventName = event.toLowerCase() + '-' + this.id;
                if(this.events[eventName]){
                  // do NOT trigger events that do not have any listeners assigned to them
                  //console.log('Triggered: ' + eventName + '; params: ' + params);
                  this.uiManager.publish(eventName, params);
                }
            },
            callEvent: function(originalEvent, eventName, eventType,pointInside,  params, queue){
               if(eventType == 'mouse'){
                  if(pointInside){
                     if(eventName == 'mousemove' && !this._mouseEntered){
                        this._mouseEntered = true;
                        this.trigger('mouseenter', [originalEvent,params]);
                        
                     }else{
                        this.trigger(eventName, [originalEvent,params]);
                     }
                        
                     
                  }else{
                     if(eventName == 'mousemove' && this._mouseEntered){
                        this._mouseEntered = false;
                        this.trigger('mouseleave', [originalEvent,params]);
                        
                     }
                  }
               }else{
                  // no support yet for keyboard events :/
               }
            }
        });
        
        
        
        ld.ext.drawables.Drawable = function(config){
            ld.ext.drawables.Drawable.superclass.constructor.call(this, config);
        };
        
        libdraw.util.ext(ld.ext.drawables.Drawable, ld.ext.drawables.EventSupport);
        
        libdraw.util.ext(ld.ext.drawables.Drawable, {
            
            render: function(rt){},
            pointInside: function(x,y){return false;},
            invalidate: function(){ 
               this.uiManager.invalidate(); 
            }
            
        });
        
        ld.ext.drawables.VisibilitySupport = function(config){
            ld.ext.drawables.VisibilitySupport.superclass.constructor.call(this, config);
            var zIndex = config.zIndex || 5;
            
            this.getZIndex = function(){return zIndex;};
            this.setZIndex = function(z){zIndex = z; this.uiManager.setZIndexTo(this, z);};
            
            this.visible = false;
        };
        
        libdraw.util.ext(ld.ext.drawables.VisibilitySupport, ld.ext.drawables.Drawable);
        libdraw.util.ext(ld.ext.drawables.VisibilitySupport, {
            show: function(){
                this.uiManager.display(this, this.getZIndex());
                this.visible = true;
            },
            hide: function(){
                this.uiManager.close(this);
                this.visible = false;
            }
        });
        
        ld.ext.drawables.DragableSupport = function(config){
            ld.ext.drawables.DragableSupport.superclass.constructor.call(this, config);
        };
        
        libdraw.util.ext(ld.ext.drawables.DragableSupport, ld.ext.drawables.VisibilitySupport);
        libdraw.util.ext(ld.ext.drawables.DragableSupport, {
            init: function(){
               ld.ext.drawables.DragableSupport.superclass.init.call(this);
               
               var self = this;
               var manager = this.uiManager;
               this.addListener('mousedown', function(eventName,rawRuntimeEvent,originalEvent,runtime){
                  manager.startDragging(self, originalEvent);
                  if(this.x !== undefined &&
                     this.y !== undefined){
                     var uiSpecs = self.uiManager.getUISpecs();
                     var x = originalEvent.pageX - uiSpecs.x;
                     var y = originalEvent.pageY - uiSpecs.y;
                     self.drag = {
                        dx: x - this.x,
                        dy: y - this.y
                     };
                  }
               });
               
               manager.on('mousemove', function(event){
                  if(self.dragging){
                     var uiSpecs = self.uiManager.getUISpecs();
                     var x = event.pageX - uiSpecs.x;
                     var y = event.pageY - uiSpecs.y;
                     self.doDrag(x,y);
                  }else if(self.dropLocation){
                     var uiSpecs = self.uiManager.getUISpecs();
                     var x = event.pageX - uiSpecs.x;
                     var y = event.pageY - uiSpecs.y;
                     self.trigger('dragover', x,y,event);
                  }
                  
               });
               
            },
            doDrag: function(toX, toY){
               if(this.x !== undefined &&
                  this.y !== undefined){
                  this.x = (toX-this.drag.dx);
                  this.y = (toY-this.drag.dy);
               }
            }
        });
        
        // extending LibDraw with Drawables
        libdraw.extend('drawables', function(version){
                return function(runtime){
                    var drawablesManager = new DrawablesManager(runtime);
                    
                    runtime.self.exec(function(){
                        drawablesManager.eachInScope(function(item){item.render(runtime)});
                    });
                    return {
                        getManager: function(){return drawablesManager;},
                        version: 1.1
                    };
                }
            }
        );
    }
})();
