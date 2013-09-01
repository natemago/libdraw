(function($){
   r = new libDraw.pkg.runtime.Runtime({
      spec: {
         width: 400,
         height: 400,
         canvas: data.canvas1 
      },
      clock:{
         interval: 1000/1000,
         mode: 'interval'
      }
   });

   var HALF_DAY = 3600*12;   
   var TWO_PI = Math.PI*2;
   var PI_HALF = Math.PI/2;
   
   var prevFps = 0;
   var fpscolor = undefined;
   shiftLeft = false;
   stop = false;
   r.register(function(g, frame, rt){
      //g.background('black');
      g.clear(0,0,400,350);
     
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
      g.text(ph + ':' + pm + ':' + ps, 145, 210 );
      
      var n = Math.round(Math.random()*300000);
      //while(n--){
         
      //}
      var fps = r.clock.getEstimatedSpeed();
      if(fps && shiftLeft){
         if(fps > prevFps){
            fpscolor = 'green';
         }else if(fps < prevFps){
            fpscolor = 'red';
         }
         //g.fill(fpscolor);
         g.fill('cyan');
         
         //g.text(fps.toFixed(2)+'fps', 20,20);
         var usage = r.clock.getMeasure().usage.usage;
         usage = usage*50;
         if(usage){
         g.strokeSize(0);
         //g.clear(399,0,1,400);
         
         g.fill('#333');
         g.rect(399,0,1,400);
         g.fill('cyan');
         g.rect(399,400 - usage,1,usage);
         
         
         
         g.ctx.putImageData(g.ctx.getImageData(0,350,400,50), -1,350);

         prevFps = fps;
         shiftLeft = false;
         }
      }
      if(fps){
         g.setFont('10px mono');
         var usage = r.clock.getMeasure().usage.usage;
         g.ctx.clearRect(0,0,150,30);
         g.text(fps.toFixed(2) + 'fps : ' + (usage*100).toFixed(2) + '%', 2,20);
      }
   });
   anotherClock = new libDraw.pkg.timer.Clock({interval: 250});
   anotherClock.addHandler(function(tick){
      shiftLeft = true;
     
   });
   
   anotherClock.start();
   r.clock.start();
   $('canvas').css('background', 'black');
})(jQuery);
