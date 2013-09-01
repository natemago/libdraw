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
   
   
   r.register(function(g, frame, rt){
      g.background('#003');
      g.fill('#222');
      g.stroke('gray');
      g.strokeSize(4);
      g.circle(200,200,130);
      g.strokeSize(0);
      g.fill('#C00');
      g.circle(200, 85, 5);
      
      // hours
      g.ctx.save();

      g.ctx.translate(200,200);
      
      var totsecs = (g.hours()%12)*3600 + g.minutes()*60 + g.seconds();
      
      g.ctx.rotate(  (totsecs/43200) * Math.PI *2 );

      g.fill('#555');
      g.rect(-5, -90, 10, 110);

      g.ctx.restore();
      
      g.fill('#555');
      g.circle(200,200, 10);
      
      // mins
      g.ctx.save();

      g.ctx.translate(200,200);
      g.ctx.rotate( ( (g.minutes())/60 ) * Math.PI *2 );

      g.fill('#AAA');
      g.rect(-2.5, -100, 5, 130);

      g.ctx.restore();
      
      g.fill('#AAA');
      g.circle(200,200, 7);
      
      
      // seconds
      g.ctx.save();

      g.ctx.translate(200,200);
      g.ctx.rotate( ( (g.seconds())/60 ) * Math.PI *2 );

      g.fill('#A00');
      g.rect(-1, -120, 2, 145);

      g.ctx.restore();
      
      g.fill('#A00');
      g.circle(200,200, 5);
      
      
      
   },'default');
   
   r.clock.start();
   
})(jQuery);
