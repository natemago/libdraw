(function($){
   r = new R({
      spec: {
         width: 400,
         height: 400,
         canvas: data.canvas1 
      },
      clock:{
         interval: 100,
         mode: 'frame'
      }
   });

   var HALF_DAY = 3600*12;   
   var TWO_PI = Math.PI*2;
   var PI_HALF = Math.PI/2;
   r.register(function(g, frame, rt){
      g.background('black');
      

      var ms = g.millis();
      var ss = g.seconds() + (ms%1000)/1000;
      var mm = g.minutes()*60 + ss;
      var hh = (g.hours()%12)*3600 + mm;
      g.fill(0,0,0);
      g.stroke('cyan');
      g.strokeSize(20);
      g.save();
      
      g.translate(200,200);
      g.ctx.rotate(-Math.PI/2);
      g.begin();  
      g.arc(0,0, 90, 0, (hh/HALF_DAY)*TWO_PI, false);
      g.rstroke();
      
      g.strokeSize(12);
      g.begin();  
      g.arc(0,0, 112, 0, (mm/3600)*TWO_PI, false);
      g.rstroke();
      
      
      g.strokeSize(7);
      g.begin();  
      g.arc(0,0, 130, 0, (ss/60)*TWO_PI, false);
      g.rstroke();
      
      g.restore();
      g.fill('cyan');

      g.setFont('24px mono');
      var ph = g.hours() < 10 ? '0' + g.hours() : g.hours();
      var pm = g.minutes() < 10 ? '0' + g.minutes() : g.minutes();
      var ps = g.seconds() < 10 ? '0' + g.seconds() : g.seconds();
      g.text(ph + ':' + pm + ':' + ps, 145,210);
      
   });
   
   r.clock.start();
   
})(jQuery);
