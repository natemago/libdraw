(function($){
   /**
    * Networks and Graphs Library, version 0.1
    *
    */
    
    // we're depending on LibDraw
    if(!window.libdraw) return;
    
    libdraw.util.ns('ld.ext.ngl');
    var nglid = function(prefix){
      return libdraw.getId(prefix || 'ngl-gen');
    };
    
    
    // Graph algorithms :
    
    var ALGORITHMS = {
        INFINITY: Number.MAX_VALUE,
        'bellman-ford': function (graph, source){
            if(!this.directional) throw new Error('Cannot apply Bellman-Ford algorithm to a undirectional Graph!');
            var vertices  = graph.vertices;
            var edges = graph.edges;
            
            
            for(var  i =0; i < vertices.length; i++){
                var v = vertices[i];
                if (v.id == source.id) v.distance = 0;
                else v.distance = ALGORITHMS.INFINITY;
                v.predecessor = null;
            }
           
          
           for(var i = 1; i < vertices.length - 1; i++){
                for(var j = 0; j < edges.length; j++){
               
                    var uv = edges[j];
                    
                    var u = uv.from;
                    var v = uv.to;
                            
                  
                   if(u.distance + uv.weight < v.distance){
                       v.distance = u.distance + uv.weight;
                       v.predecessor = u;
                   }
                }
            }
           
           for(var  i = 0; i < edges.length; i++){
               var uv = edges[i];
               var u = uv.from;
               var v = uv.to;
               if (u.distance + uv.weight < v.distance)
                   throw new Error ("Graph contains a negative-weight cycle");
           }
            
        }
    };
    
    
    
    
    
    ld.ext.ngl.NamedObject = function(config){
      libdraw.util.ext(this, config);
      this.id = this.id || nglid();
      this.name = this.name || this.id;
    };
    
    libdraw.util.ext(ld.ext.ngl.NamedObject,{
      toString: function(){
         return 'NO['+this.name+']';
      }
    });
    
    ld.ext.ngl.Vertex = function(config){
      ld.ext.ngl.Vertex.superclass.constructor.call(this, config);
      this.edges = [];
      if(!this.graph){
         throw new Error('The Vertex must belongs to a graph!');
      }
    };
    
   libdraw.util.ext(ld.ext.ngl.Vertex, ld.ext.ngl.NamedObject);
   libdraw.util.ext(ld.ext.ngl.Vertex, {
      addEdge: function(edge){
         this.edges.push(edge);
      },
      removeEdge: function(edge){
         for(var i =0; i < this.edges.length; i++){
            if(edge.id == this.edges[i].id){
               this.edges.splice(i,1);
               break;
            }
         }
      },
      eachEdge: function(callback){
         for(var i = 0; i < this.edges.length; i++){
            if(callback.call(this, this.edges[i], i) === false)break;
         }
      },
      getEdgeTo: function(vertex){
        var edge = undefined;
        this.eachEdge(function(e){
            if(e.directional){
                if(vertex.id == e.to.id){
                    edge = e;
                    return false;
                }
            }else{
                if(e.vertices[1].id == vertex.id){
                    edge = e;
                    return false;
                }
            }
        });
        return edge;
      },
      toString: function(){return 'V['+this.name+']';}
   });
   
   ld.ext.ngl.Edge = function(config){
      ld.ext.ngl.Edge.superclass.constructor.call(this, config);
      if(!this.graph){
         throw new Error('The Edge must belongs to a graph!');
      }
      
      if(this.directional){
         if(!this.from){
            throw new Error('Must specify the FROM Vertex for directional graph edge!');
         }
         if(!this.to){
            throw new Error('Must specify the TO Vertex for directional graph edge!');
         }
      }else{
         if(!this.vertices){
            throw new Error('Must specify the vertices for undirectional graph edge!');
         }
         if(this.vertices.length != 2){
            throw new Error('Each edge must be have egzactly 2 vertices!');
         }
      }
      
      
   };
   
   libdraw.util.ext(ld.ext.ngl.Edge, ld.ext.ngl.NamedObject);
   libdraw.util.ext(ld.ext.ngl.Edge, {
      toString: function(){
         if(this.directional){
            return "E["+this.name+"]: (" + this.from.toString() + " -> " + this.to.toString() + ")" + (this.weight !== undefined ? ('{' + this.weight + '}'): '');
         }else{
            return "E["+this.name+"]: (" + this.vertices[0].toString() + " , " + this.vertices[1].toString() + ")";
         }
      }
   });
   
   
   ld.ext.ngl.Graph = function(config){
      ld.ext.ngl.Graph.superclass.constructor.call(this, config);
      this.vertices = [];
      this.edges = [];
      this.edgesCahe = {};
      this.verticesCache = {};
      this.directional = !(!this.directional);
   };
   
   libdraw.util.ext(ld.ext.ngl.Graph, ld.ext.ngl.NamedObject);
   
   libdraw.util.ext(ld.ext.ngl.Graph, {
      addVertex: function(vertex){
         if(this.id != vertex.graph.id){
            throw new Error("Does not belong to this graph!");
         }
         this.vertices.push(vertex);
         this.verticesCache[vertex.id] = vertex;
      },
      createVertex: function(name, id){
         var v = new ld.ext.ngl.Vertex({
            name: name,
            id: id,
            graph: this
         });
         return v;
      },
      createEdge: function(v1, v2, name, id){
         if(this.containsVertex(v1) && this.containsVertex(v2)){
            var cfg = {name:name, id:id, graph:this, directional: this.directional};
            if(this.directional){
               cfg.from = v1;
               cfg.to = v2;
            }else{
               cfg.vertices = [v1,v2];
            }
            return new ld.ext.ngl.Edge(cfg);
         }else{
            throw new Error('Cannot create Edge to a vertex that does not belongs to this graph!');
         }
      },
      addEdge: function(){
         var edge = undefined;
         if(arguments.length == 1){
            edge = arguments[0];
         }else{
            //var v1 = arguments[0];
            //var v2 = arguments[1];
            //var name = arguments.length >= 3 ? arguments[2] : undefined;
            //var id = arguments.length >= 4 ? arguments[3] : undefined;
            edge = this.createEdge.apply(this, arguments);//v1, v2, name, id);
         }
         
         if(this.id != edge.graph.id){
            throw new Error('Edge does not belong to this graph!');
         }
         if(this.directional != edge.directional){
            throw new Error('Cannot add directional edge to undirectional graph and vice versa!');
         }
         var v1 = this.directional ? edge.from : edge.vertices[0];
         var v2 = this.directional ? edge.to : edge.vertices[1];
         if(!this.containsVertex(v1) || !this.containsVertex(v2)){
            throw new Error('Cannot add edge to a vertex to another graph!');
         }
         
         this.edges.push(edge);
         this.edgesCahe[edge.id] = edge;
         v1.addEdge(edge);
         v2.addEdge(edge);
      },
      
      eachEdge: function(callback){
         for(var  i =0; i< this.edges.length; i++){
            var r = callback.call(this, this.edges[i], i);
            if(r === false) break;
         }
      },
      eachVertex: function(callback){
         for(var  i =0; i< this.vertices.length; i++){
            var r = callback.call(this, this.vertices[i], i);
            if(r === false) break;
         }
      },
      containsVertex: function(v){
         return !(!this.verticesCache[v.id]);
      },
      containsEdge: function(e){
         return !(!this.edgesCahe[e.id]);
      },
      
      toString: function(){
         var totalV = this.vertices.length;
         var totalE = this.edges.length;
         var s = 'G['+this.name+']: \nVertices ('+totalV+'): ';
         
         this.eachVertex(function(v,i){
            s += v.toString();
            if(i < (totalV-1)){
               s+= ', ';
            }
         });
         s+="\nEdges ("+totalE+"): ";
         
         this.eachEdge(function(e,i){
            s += e.toString();
            if(i < (totalE-1)){
               s+= ', ';
            }
         });
         return s;
      },
      getEdgeBetween: function(v1, v2){
        v1 = this.verticesCache[v1.id || v1];
        v2 = this.verticesCache[v2.id || v2];
        
        return v1.getEdgeTo(v2);
      },
      applyAlgorithm: function(){
        if(arguments.length < 1) throw new Error('You must specify at least the algorithm name.');
        var algorithm = arguments[0];
        var implementation = ALGORITHMS[algorithm];
        if(implementation){
            var args = [this];
            for(var i = 1; i < arguments.length; i++){args.push(arguments[i]);};
            implementation.apply(this, args);
        }
      }
   });
   
   
    ld.ext.ngl.WeightedGraph = function(config){
        ld.ext.ngl.WeightedGraph.superclass.constructor.call(this, config);
    };
    libdraw.util.ext(ld.ext.ngl.WeightedGraph, ld.ext.ngl.Graph);
    libdraw.util.ext(ld.ext.ngl.WeightedGraph, {
        createEdge: function(v1, v2, name, id, weight){
            var e = ld.ext.ngl.WeightedGraph.superclass.createEdge.call(this,v1, v2, name, id);
            e.weight = weight || 0;
            return e;
        }
    });
   
   // UI representation 
   
   libdraw.util.ns('ld.ext.ngl.ui');
   
   ld.ext.ngl.ui.UIVertex = function(config){
      ld.ext.ngl.ui.UIVertex.superclass.constructor.call(this, config);
      this.x = this.x || 0;
      this.y = this.y || 0;
      this.vertex.ui = this;
      this.uiSettings = this.uiSettings || {
         radius: 10,
         lineWidth: 2,
         textColor: 'rgb(80,80,80)',
         fill: 'rgb(160,160,255)',
         stroke: 'rgb(200,200,200)',
         focused: false
      };
      
      
   };
   
   
   libdraw.util.ext(ld.ext.ngl.ui.UIVertex, ld.ext.drawables.DragableSupport);
   libdraw.util.ext(ld.ext.ngl.ui.UIVertex, {
      init: function(){
         ld.ext.ngl.ui.UIVertex.superclass.init.call(this);
         this.addListener('mouseenter', function(){
            this.uiSettings = this.getUISettings(true);
         });
         
         this.addListener('mouseleave', function(){
            this.uiSettings = this.getUISettings(false);
         });
         this.addListener('dblclick', function(){
            console.log('CLICK ' + this.vertex.toString());
            if(this.marked){
               this.vertex.eachEdge(function(e){
                  if(e.ui)e.ui.unmark();
               });
               this.marked = false;
            }else{
               this.vertex.eachEdge(function(e){if(e.ui)e.ui.mark();});
               this.marked = true;
            }
         });
      },
      getUISettings: function(focus){
         if (focus){
            return {
                radius: 18,
                lineWidth: 4,
                textColor: 'rgb(80,80,80)',
                fill: 'rgb(200,200,255)',
                stroke: 'rgb(220,220,220)',
                focused: true
            };
         }else{
            return {
               radius: 10,
               lineWidth: 2,
               textColor: 'rgb(80,80,80)',
               fill: 'rgb(160,160,255)',
               stroke: 'rgb(200,200,200)',
               focused: false
            };
         }
      },
      drawVertex: function(x, y,vertex, rt){
         rt.fill(this.uiSettings.fill);
         rt.stroke(this.uiSettings.stroke);
         rt.strokeSize(this.uiSettings.lineWidth);
         rt.circle(this.x, this.y, this.uiSettings.radius);
      },
      drawLabel: function(x,y, vertex, rt){
         rt.fill(this.uiSettings.textColor);
         if(this.uiSettings.focused){
            rt.text("Vertex: " + vertex.toString(), this.x + this.uiSettings.radius/2, this.y + this.uiSettings.radius/2);
         }else{
            rt.text(vertex.toString(), this.x + 15, this.y + 15);
         }
      },
      render: function(rt){
         this.drawVertex(this.x, this.y, this.vertex, rt);
         this.drawLabel(this.x, this.y, this.vertex, rt);
      },
      pointInside: function(x,y){
         return Math.sqrt((x-this.x)*(x-this.x) + (y - this.y)*(y - this.y)) <= this.uiSettings.radius;
      },
      doDrag: function(toX, toY){
         this.x = toX;
         this.y = toY;
      }
   });
   
   
   ld.ext.ngl.ui.UIEdge = function(config){
      ld.ext.ngl.ui.UIEdge.superclass.constructor.call(this, config);
      
      this.edge.ui = this;
      this.uiSettings = this.uiSettings || {
         lineWidth: 2,
         textColor: 'rgb(80,80,80)',
         stroke: 'rgb(0,0,0)',
         focused: false
      };
      this.vertex1 = this.edge.directional ? this.edge.from : this.edge.vertices[0];
      this.vertex2 = this.edge.directional ? this.edge.to : this.edge.vertices[1];
   };
   
   libdraw.util.ext(ld.ext.ngl.ui.UIEdge, ld.ext.drawables.VisibilitySupport);
   libdraw.util.ext(ld.ext.ngl.ui.UIEdge, {
      render: function(rt){
         this.drawEdgeLine(this.vertex1, this.vertex2, rt);
         if(this.edge.directional){
            this.drawArrow(this.vertex2, rt);
         }
         this.drawLabel(rt);
      },
      drawEdgeLine: function (vertex1, vertex2,rt){
         rt.strokeSize(this.uiSettings.lineWidth);
         rt.stroke(this.uiSettings.stroke);
         rt.begin();
         rt.moveTo(vertex1.ui.x, vertex1.ui.y);
         rt.lineTo(vertex2.ui.x, vertex2.ui.y);
         rt.strokePath();
         rt.close();
      },
      drawArrow: function(toVertex, rt){},
      drawLabel: function(rt){
         var x = (this.vertex1.ui.x + this.vertex2.ui.x)/2 + 2;
         var y = (this.vertex1.ui.y + this.vertex2.ui.y)/2 + 2;
         rt.fill(this.uiSettings.textColor);
         rt.text(this.edge.toString(), x, y);
      },
      mark: function(){
         this.uiSettings.stroke='rgb(255,0,0)';
      },
      unmark: function(){
         this.uiSettings.stroke='rgb(0,0,0)';
      }
   });
   
   
   ld.ext.ngl.ui.UIGraph = function(config){
      this.uiEdges = [];
      this.uiVertices = [];
      ld.ext.ngl.ui.UIGraph.superclass.constructor.call(this, config);
      this.graph.ui = this;
   };
   libdraw.util.ext(ld.ext.ngl.ui.UIGraph, ld.ext.drawables.VisibilitySupport);
   libdraw.util.ext(ld.ext.ngl.ui.UIGraph, {
      render: function(rt){
         rt.text('Graph: ' + this.graph.toString(), 20, 30);
      },
      init: function(){
         ld.ext.ngl.ui.UIGraph.superclass.init.call(this);
         this.drawGraph();
      },
      
      drawGraph: function(){
         var self = this;
         this.graph.eachVertex(function(vertex, i){
            var uiv =  self.createUIVertex(vertex, i, self.graph, self.getUISettings());
            if(uiv){
               self.uiVertices.push(uiv);
            }
         });
         
         this.graph.eachEdge(function(edge, i){
            var uie =  self.createUIEdge(edge, i, self.graph, self.getUISettings());
            if(uie){
               self.uiEdges.push(uie);
            }
         });
      },
      createUIVertex: function(vertex, n, graph, uiSettings){
         var x = Math.floor(Math.random()*(uiSettings.width - 40))+20;
         var y = Math.floor(Math.random()*(uiSettings.height - 40))+20;
         
         var v =  new ld.ext.ngl.ui.UIVertex({
            vertex: vertex,
            x: x,
            y: y,
            uiManager: this.uiManager
         });
         
         return v;
      },
      createUIEdge: function(edge, n, graph, uiSettings){
         return new ld.ext.ngl.ui.UIEdge({edge: edge, uiManager: this.uiManager});
      },
      eachEdge: function(callback){
         for(var  i = 0; i < this.uiEdges.length; i++){
            if(callback.call(this, this.uiEdges[i], i) === false)break;
         }
      },
      eachVertex: function(callback){
         for(var  i = 0; i < this.uiVertices.length; i++){
            if(callback.call(this, this.uiVertices[i], i) === false)break;
         }
      },
      show: function(){
         ld.ext.ngl.ui.UIGraph.superclass.show.call(this);
         this.eachEdge(function(uiEdge){
            uiEdge.show();
         });
         this.eachVertex(function(uiVertex){
            uiVertex.show();
         });
      },
      getUISettings: function(){
         return this.uiSettings || {
            width: 200,
            height: 200
         };
      },
      markPath: function(edges){
         var  i = 0;
         this.eachEdge(function(e){

            if(e.edge.name == edges[i]){
               e.mark();
            }
            i++;
         });
      }
   });
   
   libdraw.extend('ngl',function(version){
      return function(runtime){
        return {
            version: 0.1,
            description: 'Networks and Graph Library for JavaScript',
            getAvailibleAlgorithms: function(){
                var algs = [];
                for(var alg in ALGORITHMS){
                    if(ALGORITHMS.hasOwnProperty(alg) && typeof(ALGORITHMS[alg]) == 'function'){
                        algs.push(alg);
                    }
                }
                return algs;
            }
        };
      };
   });
})(jQuery);