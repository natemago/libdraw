(function($){
   r = new libDraw.pkg.runtime.Runtime({
      spec: {
         width: 600,
         height: 400,
         canvas: data.canvas1 
      },
      clock:{
         interval: 1000/30,
         mode: 'interval'
      }
   });
   
   
   data.canvas1.style.background='none';
   document.body.style.background='rgba(0,0,0,0.7) url(./tests/imgs/pattern-4.png)';
   r.register(function(g, frame, rt){
      g.fill('#0ff');
      g.begin();
      g.rect(10,10,30,50);
      g.close();
   });
   
   
   r.clock.start();
   
   
   var Segment = function(n, scale, theme){
      this.points = Segment.SEGMENT[n];
      this.scale = scale;
      this.theme = theme;
      this.getPoints = function(xoff,yoff){
         var r = [];
         for(var i = 0; i < this.points.length; i++){
            r.push([
               this.points[i][0]*this.scale+xoff,
               this.points[i][1]*this.scale+yoff
            ]);
         }
         return r;
      };
      var state = 'off';
      this.render = function(g, dx, dy){
         g.fill(this.theme.segment[state].fill);
         g.stroke(this.theme.segment[state].borderColor);
         g.strokeSize(this.theme.segment[state].borderWidth);
         var pts = this.getPoints(dx,dy);
         g.complex(pts, true);
      };
      
      this.on = function(){state='on' ;};
      this.off= function(){state='off';};
      
   };
   Segment.H_SEGMENT = [[0,2] ,[2,0] ,[12,0], [14,2], [12,4], [2,4]];
   Segment.V_SEGMENT = [[0,2] ,[2,0] ,[4,2], [4,12], [2,14], [0,12]];
   Segment._getSegment = function(v, xoff, yoff){
      var s = undefined;
      if(v == 'vertical'){
         s = Segment.V_SEGMENT;
      }else{
         s = Segment.H_SEGMENT;
      }
      var r = [];
      for(var  i = 0; i <s.length; i++){
         r.push([
            s[i][0]+xoff,
            s[i][1]+yoff
         ]);
      }
      return r;
   };
   Segment.SEGMENT = [
      Segment._getSegment('horisontal',3 ,0 ), // A
      Segment._getSegment('vertical'  ,16,3 ), // B
      Segment._getSegment('vertical'  ,16,19), // C
      Segment._getSegment('horisontal',3 ,32), // D
      Segment._getSegment('vertical'  ,0 ,19), // E
      Segment._getSegment('vertical'  ,0 ,3 ), // F
      Segment._getSegment('horisontal',3 ,16)  // G
   ];
   
   
   var Digit = function(d,scale,x,y, theme){
      this.theme = theme;
      var digits = [];
      var i = 7;
      while(i-->0){
         digits[i] = new Segment(i,scale,theme);
      }
      
      this.x=x||0;
      this.y=y||0;
      
      this.scale = scale;
      this.setValue = function(v){
         //debugger
         if(v<0 || v>15){
            throw new Error("Invalid range for digit. Must be between 0 and 15");
         }
         
         var dm = Digit.DIGITS[v];
         var m = 0x1<<6;
         var c = 0;
         while(m){
            if(m&dm){
               digits[c].on();
            }else{
               digits[c].off();
            }
            c++;
            m>>=1;
         }
      };
      
      
      this.render = function(g){
         g.fill(this.theme.digit.fill);
         g.stroke(this.theme.digit.borderColor);
         g.strokeSize(this.theme.digit.borderWidth || 0);
         //debugger
         for(var i = 0; i < digits.length; i++){
            
            digits[i].render(g, this.x, this.y);
         }
      };
      
      this.setScale = function(scale){
          for(var i = 0; i < digits.length; i++){
            digits[i].scale = scale;
          }
          this.scale=scale;
      };
      
      this.getWidth = function(){
         return (Segment.SEGMENT[1][2][0] - Segment.SEGMENT[5][0][0])*this.scale;
      };
      this.getHeight = function(){
         return (Segment.SEGMENT[3][5][1] - Segment.SEGMENT[0][1][1])*this.scale;
      };
      this.setValue(d);
      
   };
   
   Digit.DIGITS = [
      0x7E, // 0
      0x30, // 1
      0x6D, // 2
      0x79, // 3
      0x33, // 4
      0x5B, // 5
      0x5F, // 6
      0x70, // 7
      0x7F, // 8
      0x7B, // 9
      0x77, // A
      0x1F, // B
      0x4E, // C
      0x3D, // D
      0x4F, // E
      0x47  // F
   ];
   
   
   
   var Separator = function(x,y,w,h,theme){
      this.theme = theme;
      this.x = x;
      this.y= y;
      this.width = w;
      this.height = h;
      
      
      
      this.render = function(g){
         var hw = this.width/2;
         var hh = this.height/2;
         var r = hw - theme.separator.borderWidth - theme.separator.padding;
         g.fill(this.theme.separator.fill);
         g.stroke(this.theme.separator.borderColor);
         g.strokeSize(this.theme.separator.borderWidth);
         //debugger
         g.circle(this.x+hw,this.y+hh-this.theme.separator.padding-r, r);
         g.circle(this.x+hw,this.y+hh+this.theme.separator.padding+r, r);
      };
   };
   
   
   var DDGroup = function(x,y,scale, theme, hasSep){
      //debugger
      this.x = x;
      this.y=y;
      this.scale=scale;
      this.theme=theme;
      this.d1=new Digit(0,this.scale,this.x,this.y,this.theme);
      this.d2=new Digit(0,this.scale,this.x+this.d1.getWidth()+this.theme.digit.padding,this.y,this.theme);
      this.sep = new Separator(
            this.x+this.d1.getWidth()*2+this.theme.digit.padding + this.theme.separator.padding, 
            this.y, 
            this.d1.getWidth()*0.7, 
            this.d1.getHeight(), 
            this.theme);
      
      
      this.render = function(g){
         this.d1.render(g);
         this.d2.render(g);
         if(hasSep)this.sep.render(g);
      };
      
      this.setPosition = function(x,y){
         this.x = x;
         this.y = y;
         this.d1.x = x;
         this.d1.y = y;
         this.d2.x = this.d1.getWidth()+x+this.theme.digit.padding;
         this.d2.y = y;
      };
      
      this.setScale = function(scale){
         this.scale = scale;
         this.d1.setScale(scale);
         this.d2.setScale(scale);
         this.setPosition(this.x,this.y);
      };
      
      this.setTheme = function(theme){
         this.d1.theme = theme;
         this.d2.theme = theme;
         this.sep.theme = theme;
      };
      
      
      this.setValue = function(v1,v2){
         this.d1.setValue(v1);
         this.d2.setValue(v2);
      };
      
      this.getWidth = function(){
         var rv= this.d1.getWidth()*2+this.theme.digit.padding;
         if(hasSep){
            rv+=this.sep.width+this.theme.separator.padding;
         }
         return rv;
      }
      
      this.getHeight = function(){
         return this.d1.getHeight();
      }
   };
   
   var Display = function( x,y, scale, theme){
      this.theme = theme;
      this.x = x;
      this.y = y;
      
      this.groups = {};
      
      var self = this;
      
      this.groups.hh = new DDGroup(x,y,scale,theme,true);
      this.groups.mm = new DDGroup(x+this.groups.hh.getWidth(),y,scale,theme,true);
      this.groups.ss = new DDGroup(this.groups.mm.x+this.groups.mm.getWidth(),y,scale,theme,false);
      
      
      this.groups.dp = {
         x: self.groups.ss.x + self.groups.ss.getWidth() + self.theme.dp.width/2 + self.theme.dp.padding,
         y: self.groups.ss.y + self.groups.ss.getHeight() - (self.theme.dp.width/2 + self.theme.dp.padding),
         render: function(g){
            
            g.fill(self.theme.dp.fill);
            g.stroke(self.theme.dp.borderColor);
            g.strokeSize(self.theme.dp.borderWidth);
            
            g.circle(this.x,
                     this.y,
                      self.theme.dp.width/2);
         },
         getWidth: function(){
            return self.theme.dp.width;
         }
      };
      
      this.groups.dd = new Digit(0, scale, this.groups.dp.x + this.groups.dp.getWidth(),this.y,this.theme);
      
      this.render = function(g){
         this.groups.hh.render(g);
         this.groups.mm.render(g);
         this.groups.ss.render(g);
         this.groups.dp.render(g);

         this.groups.dd.render(g);
      };
      
      
      this.setValue = function(hh,mm,ss,ms){
         this.groups.hh.setValue(Math.floor(hh/10),hh%10);
         this.groups.mm.setValue(Math.floor(mm/10),mm%10);
         this.groups.ss.setValue(Math.floor(ss/10),ss%10);
         this.groups.dd.setValue(Math.floor(ms/100));
      };
      
      this.getWidth = function(){
         return this.groups.dd.getWidth() + 
            this.groups.dd.x- this.x;
      }
      
      this.getHeight = function(){
         return this.groups.ss.getHeight();
      }
   };
   
   
   
   
   
   var THEME = {
      digit:{
         fill: '#0aa',
         borderColor: '#444',
         borderWidth: 1,
         padding: 3
      },
      separator:{
         fill: '#0ee',//'#800',
         borderColor: 'rgba(0,0,0,0)',
         borderWidth: 2,
         padding:3
      },
      segment:{
         on:{
            fill: '#0ee',//'#A00',
            borderColor: '#000',
            borderWidth: 0
         },
         off:{
            fill: '#066',//'#300',
            borderColor: '#000',
            borderWidth: 0
         }
      },
      dp:{
         fill: '#0ee',//'#800',
         borderColor: '#000',
         borderWidth: 0,
         width: 7,
         padding: 3
      }
   };
   
   
   
   
   var display = new Display(100,100,1.3,THEME);
   

   
   var img = document.createElement('img');
   
   img.onload = function(){
       r.register(function(g,f,rt){
          g.clear();
            //var dt = new Date();
            //display.setValue(dt.getHours(),dt.getMinutes(),dt.getSeconds());
            //debugger
          
          display.render(g);
          g.image(img, display.x-40, display.y-20, display.getWidth()+120, display.getHeight()+40); 
      });
   };
   
   img.src = 'tests/imgs/stopwatch-display-2.png';
   
   //document.body.appendChild(img);
   
   
  
   
   var clock = new libDraw.pkg.timer.Clock({
      interval: 50,
      mode: 'interval'
   });
   clock.addHandler(function(){
      var dt = new Date();
      display.setValue(dt.getHours(),dt.getMinutes(),dt.getSeconds(), dt.getTime()%1000);
   });
   
   clock.start();
   
   
   
   var m = [
      '<div>',
         '<div style="background: #0aa; box-shadow: inset 0 0 10px 10px rgba(0,0,0,0.4); height: 40px; padding: 10px; width: 50px;">Button 1</div>',
         '<div style="">Button 2</div>',
      '</div>'
   ].join('');
   
   
   
   $(document.body).append($(m));
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
   
})(jQuery);
